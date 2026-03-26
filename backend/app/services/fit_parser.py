"""
FIT File Parser Service.

Extracts running dynamics metrics from Garmin FIT files.
Ported from running-coach/scripts/parse_fit.py
"""

from datetime import datetime
from pathlib import Path
from typing import Optional
import statistics

from fitparse import FitFile


# Grading thresholds
GRADES = {
    "cadence": {"A": 180, "B": 170, "C": 160},  # spm
    "gct": {"A": 220, "B": 250, "C": 280},  # ms (lower is better)
    "gct_balance": {"A": 1, "B": 2, "C": 4},  # % deviation from 50
    "vertical_ratio": {"A": 8, "B": 9, "C": 10},  # % (lower is better)
}

RACE_DISTANCES = [
    ("1 km", 1000),
    ("1 mile", 1609.34),
    ("5 km", 5000),
    ("10 km", 10000),
    ("15 km", 15000),
    ("Half Marathon", 21097.5),
    ("30 km", 30000),
    ("Marathon", 42195),
]


def grade_metric(metric: str, value: float) -> str:
    """Assign A/B/C/D grade to a metric value based on established thresholds.

    Handles bidirectional metrics: cadence is higher-is-better, while GCT,
    GCT balance (deviation from 50%), and vertical ratio are lower-is-better.
    Thresholds are sourced from sports science literature on recreational
    vs elite runners.
    """
    thresholds = GRADES.get(metric)
    if not thresholds:
        return "B"  # Default

    if metric in ["gct", "gct_balance", "vertical_ratio"]:
        # Lower is better
        if value <= thresholds["A"]:
            return "A"
        elif value <= thresholds["B"]:
            return "B"
        elif value <= thresholds["C"]:
            return "C"
        return "D"
    else:
        # Higher is better (cadence)
        if value >= thresholds["A"]:
            return "A"
        elif value >= thresholds["B"]:
            return "B"
        elif value >= thresholds["C"]:
            return "C"
        return "D"


def parse_fit_file(fit_path: str) -> dict:
    """Parse a Garmin FIT binary file and extract structured running data.

    This is the core analysis entry point. A single FIT file contains all
    sensor data from a run — heart rate, cadence, GCT, GPS, laps, etc. —
    encoded as binary protocol buffers. We use fitparse to decode these
    and produce:

    - summary: Session-level stats (distance, duration, pace, activity type)
    - metrics: Averaged running dynamics with A-D grades
    - timeSeries: Per-second records for interactive Skia charts
    - laps: Garmin auto-lap splits with pace, cadence, HR
    - fatigue: First-half vs second-half comparison (direction-aware)
    - bestEfforts: Moving time at race distance milestones (1K to marathon)
    - hasRunningDynamics: Whether an external pod (HRM-600) was detected

    Running dynamics detection requires >50% of records to have GCT balance
    data — watches alone don't report this field.
    """
    fit_path = Path(fit_path)
    if not fit_path.exists():
        raise FileNotFoundError(f"FIT file not found: {fit_path}")

    try:
        fitfile = FitFile(str(fit_path))
    except Exception as e:
        raise ValueError(f"Corrupt or unreadable FIT file: {e}")

    # Extract activity summary from session
    summary = extract_session_summary(fitfile)

    # Extract 1-second records
    records = extract_records(fitfile)

    # Extract laps
    laps = extract_laps(fitfile)

    # Compute summary metrics with grades
    metrics = compute_metrics(records)

    # Compute fatigue comparison
    fatigue = compute_fatigue_comparison(records)

    # Compute best efforts at race distance milestones
    best_efforts = compute_best_efforts(records, summary.get("totalDistance", 0))

    # Detect running dynamics pod (HRM-600 or similar)
    # Require GCT balance data - watches without pods don't have this
    # Also require sufficient data points (not just a few readings)
    gct_balance_count = sum(1 for r in records if r.get("gctBalance") is not None)
    has_running_dynamics = gct_balance_count > len(records) * 0.5  # >50% of records have balance data

    return {
        "summary": summary,
        "metrics": metrics,
        "timeSeries": records,
        "laps": laps,
        "fatigue": fatigue,
        "hasRunningDynamics": has_running_dynamics,
        "bestEfforts": best_efforts,
    }


def extract_session_summary(fitfile: FitFile) -> dict:
    """Extract session-level summary from the FIT file's session message.

    Key decisions:
    - Uses total_timer_time (active running) for duration/pace, not
      total_elapsed_time which includes pauses and rest intervals
    - Appends 'Z' to timestamps since FIT stores UTC — without this,
      JavaScript Date parsing shifts dates by the local timezone offset
    - Maps sub_sport field to activity type (treadmill, trail, track)
    """
    summary = {
        "startTime": None,
        "totalDistance": 0,
        "totalDuration": 0,
        "avgPace": 0,
        "avgHeartRate": None,
        "activityName": "Run",
        "activityType": "running",  # Default to outdoor running
    }

    for record in fitfile.get_messages("session"):
        data = {field.name: field.value for field in record.fields}

        if data.get("start_time"):
            start = data["start_time"]
            # FIT timestamps are UTC - append Z so JS converts to local time
            if isinstance(start, datetime):
                summary["startTime"] = start.isoformat() + "Z"
            else:
                summary["startTime"] = str(start)

        summary["totalDistance"] = data.get("total_distance", 0)
        # Use timer_time (active running) not elapsed_time (includes pauses)
        timer_time = data.get("total_timer_time", 0)
        elapsed_time = data.get("total_elapsed_time", 0)
        summary["totalDuration"] = timer_time or elapsed_time
        summary["totalElapsedDuration"] = elapsed_time if elapsed_time != timer_time else None
        summary["avgHeartRate"] = data.get("avg_heart_rate")

        # Extract sub_sport to determine activity type
        # FIT sub_sport values: 1=treadmill, 2=street, 4=track, 5=trail, etc.
        sub_sport = data.get("sub_sport")
        if sub_sport == 1 or sub_sport == "treadmill":
            summary["activityType"] = "treadmill_running"
        elif sub_sport == 5 or sub_sport == "trail":
            summary["activityType"] = "trail_running"
        elif sub_sport == 4 or sub_sport == "track":
            summary["activityType"] = "track_running"

        # Calculate average pace (sec/km)
        if summary["totalDistance"] > 0:
            summary["avgPace"] = (
                summary["totalDuration"] / summary["totalDistance"]
            ) * 1000

        break  # Only need first session

    return summary


def extract_records(fitfile: FitFile) -> list[dict]:
    """Extract per-second sensor records for time series charts.

    Maps Garmin-specific field names to our schema (e.g. stance_time → gct,
    stance_time_balance → gctBalance). Handles Garmin's half-cadence encoding
    where values <120 need doubling. Timestamps are converted to seconds
    from activity start for chart x-axis positioning.

    Also extracts glucose_level from CGM-equipped devices and cumulative
    distance for best-effort calculations.
    """
    records = []
    start_time = None

    for record in fitfile.get_messages("record"):
        data = {}

        raw_cadence = None
        for field in record.fields:
            name = field.name
            value = field.value

            if value is None:
                continue

            # Track start time for relative timestamps
            if name == "timestamp":
                if start_time is None:
                    start_time = value
                # Convert to seconds from start
                if isinstance(value, datetime) and isinstance(start_time, datetime):
                    data["timestamp"] = (value - start_time).total_seconds()
                continue

            # Map field names to our schema
            if name == "heart_rate":
                data["heartRate"] = value
            elif name == "cadence":
                # Defer cadence processing — need speed to determine if
                # this is half-cadence encoding or genuine walking cadence
                raw_cadence = value
            elif name in ["enhanced_speed", "speed"]:
                if value and value > 0:
                    # Convert m/s to sec/km pace
                    data["pace"] = 1000 / value
            elif name == "stance_time":
                data["gct"] = value  # Ground contact time in ms
            elif name == "stance_time_balance":
                data["gctBalance"] = value
            elif name == "vertical_ratio":
                data["verticalRatio"] = value
            elif name == "vertical_oscillation":
                data["verticalOscillation"] = value
            elif name == "step_length":
                data["strideLength"] = value / 100  # cm to m
            elif name == "power":
                data["power"] = value
            elif name == "glucose_level":
                data["glucoseLevel"] = value
            elif name == "distance":
                data["distance"] = value  # cumulative meters from start

        # Resolve deferred cadence — Garmin stores half-cadence for running,
        # but walking cadence (80-115 spm) is genuine. Use speed to decide:
        # if pace suggests running (< 8:20/km), double it.
        if raw_cadence is not None:
            is_running = data.get("pace") and data["pace"] < 500
            data["cadence"] = raw_cadence * 2 if raw_cadence < 120 and is_running else raw_cadence

        if data and "timestamp" in data:
            records.append(data)

    return records


def extract_laps(fitfile: FitFile) -> list[dict]:
    """Extract lap data from FIT file.

    Includes FIT intensity and lap_trigger fields so consumers (e.g.
    workout_compliance) can distinguish recovery laps from active intervals.
    """
    laps = []
    lap_num = 0

    for record in fitfile.get_messages("lap"):
        lap_num += 1
        data = {field.name: field.value for field in record.fields}

        timer_time = data.get("total_timer_time", 0)
        elapsed_time = data.get("total_elapsed_time", 0)

        lap = {
            "lapNumber": lap_num,
            "distance": data.get("total_distance", 0),
            # duration = active running time (for pace/compliance)
            "duration": timer_time or elapsed_time,
            # elapsedDuration = total time including rest/pause (for context)
            "elapsedDuration": elapsed_time if elapsed_time != timer_time else None,
            "avgHeartRate": data.get("avg_heart_rate"),
            "avgCadence": data.get("avg_running_cadence") or data.get("avg_cadence"),
            "avgGct": data.get("avg_stance_time"),
            # FIT-tagged step classification (for skip detection)
            "intensity": data.get("intensity"),        # warmup, active, recovery, cooldown
            "lapTrigger": data.get("lap_trigger"),     # distance, time, manual, session_end
        }

        # Calculate pace
        if lap["distance"] > 0 and lap["duration"] > 0:
            lap["avgPace"] = (lap["duration"] / lap["distance"]) * 1000
        else:
            lap["avgPace"] = 0

        # Double cadence if stored as half-cadence. Lap records don't have
        # speed, so use pace (derived from distance/time) as the running check.
        if lap["avgCadence"] and lap["avgCadence"] < 120 and lap["avgPace"] > 0 and lap["avgPace"] < 500:
            lap["avgCadence"] = lap["avgCadence"] * 2

        laps.append(lap)

    return laps


def compute_metrics(records: list[dict]) -> dict:
    """Compute summary metrics with grades from active running records.

    Filters out artifact data (stops, pauses, walking) before averaging
    to match the client-side filterArtifacts behavior. Without this,
    zero-cadence and high-GCT readings from traffic lights and water
    breaks skew averages and produce lower grades than actual running form.
    """
    # Filter for active running records — exclude stops/walks.
    # Default cadence to 101 (passing) for records without cadence field
    # so that watches without running dynamics still contribute HR/GCT data.
    active = [
        r for r in records
        if r.get("cadence", 101) > 100 and r.get("pace", float("inf")) < 600
    ]
    if not active:
        active = records  # Fallback if filtering removes everything

    def avg(field: str) -> Optional[float]:
        values = [r[field] for r in active if field in r and r[field] is not None]
        return statistics.mean(values) if values else None

    cadence = avg("cadence")
    gct = avg("gct")
    gct_balance = avg("gctBalance")
    vertical_ratio = avg("verticalRatio")
    heart_rate = avg("heartRate")

    metrics = {}

    if cadence is not None:
        metrics["avgCadence"] = {
            "value": round(cadence, 1),
            "grade": grade_metric("cadence", cadence),
        }

    if gct is not None:
        metrics["avgGct"] = {
            "value": round(gct, 1),
            "grade": grade_metric("gct", gct),
        }

    if gct_balance is not None:
        deviation = abs(gct_balance - 50)
        metrics["avgGctBalance"] = {
            "value": round(gct_balance, 1),
            "grade": grade_metric("gct_balance", deviation),
        }

    if vertical_ratio is not None:
        metrics["avgVerticalRatio"] = {
            "value": round(vertical_ratio, 1),
            "grade": grade_metric("vertical_ratio", vertical_ratio),
        }

    if heart_rate is not None:
        metrics["avgHeartRate"] = {"value": round(heart_rate, 1)}

    return metrics


def _interpolate_elapsed_at_distance(records: list[dict], target_m: float) -> Optional[float]:
    """Find wall-clock elapsed time at a target cumulative distance via linear interpolation.

    Returns elapsed seconds from start, or None if target not reached.
    """
    prev_ts = None
    prev_dist = None

    for rec in records:
        ts = rec.get("timestamp")
        dist = rec.get("distance")
        if ts is None or dist is None:
            continue

        if prev_ts is not None and dist >= target_m and dist > prev_dist:
            frac = (target_m - prev_dist) / (dist - prev_dist)
            return prev_ts + frac * (ts - prev_ts)

        if dist is not None and ts is not None:
            prev_ts = ts
            prev_dist = dist

    return None


def compute_best_efforts(
    records: list[dict],
    total_distance_m: float,
) -> list[dict]:
    """Compute elapsed time at common race distance milestones.

    Interpolates wall-clock time at each distance from per-second records.
    Reports the raw interpolated time rather than applying a session-wide
    pause ratio — a session-level scale factor would incorrectly reduce
    short efforts (e.g. 1K) when pauses occurred later in the run.
    """
    if not records or total_distance_m <= 0:
        return []

    efforts = []
    for name, distance in RACE_DISTANCES:
        if distance > total_distance_m:
            continue
        elapsed = _interpolate_elapsed_at_distance(records, distance)
        if elapsed is not None:
            avg_pace_sec_km = elapsed / (distance / 1000)
            efforts.append({
                "name": name,
                "distanceMeters": distance,
                "elapsedTimeSec": round(elapsed, 1),
                "avgPaceSecKm": round(avg_pace_sec_km, 1),
            })

    return efforts


def compute_fatigue_comparison(records: list[dict]) -> list[dict]:
    """Compare first-half vs second-half metrics to detect fatigue.

    Each metric is direction-aware: cadence increasing = improved (runner
    maintaining turnover), GCT/VR increasing = degraded (form breaking down).
    A ±2% threshold defines the stable zone. Heart rate is intentionally
    excluded because cardiac drift (HR rising over time) is physiologically
    inevitable and not actionable coaching insight.
    """
    if len(records) < 20:
        return []

    mid = len(records) // 2
    first_half = records[:mid]
    second_half = records[mid:]

    def avg(data: list[dict], field: str) -> Optional[float]:
        values = [r[field] for r in data if field in r and r[field] is not None]
        return statistics.mean(values) if values else None

    comparisons = []

    # higher_is_better: True if increase = improved, False if decrease = improved
    metrics_config = [
        ("cadence", "Cadence", True),  # Higher cadence is better
        ("gct", "Ground Contact Time", False),  # Lower GCT is better
        ("verticalRatio", "Vertical Ratio", False),  # Lower VR is better
    ]

    for field, label, higher_is_better in metrics_config:
        first = avg(first_half, field)
        second = avg(second_half, field)

        if first is not None and second is not None:
            change = ((second - first) / first) * 100
            # Determine direction based on metric type
            if higher_is_better:
                direction = "improved" if change > 2 else "degraded" if change < -2 else "stable"
            else:
                direction = "improved" if change < -2 else "degraded" if change > 2 else "stable"
            comparisons.append({
                "metric": label,
                "firstHalf": round(first, 1),
                "secondHalf": round(second, 1),
                "change": round(change, 1),
                "changeDirection": direction,
            })

    return comparisons
