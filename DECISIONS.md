# Product Decisions

Living document of decisions that have shaped the product direction. Update as new decisions are made.

---

## Data & Accuracy

| # | Decision | Context |
|---|----------|---------|
| 1 | Use `total_timer_time` (active running) for duration/pace, not `total_elapsed_time` | Elapsed includes pauses/rest between intervals — inflated times and slow paces |
| 2 | Show elapsed duration in parentheses when different from active duration | Gives context on rest periods without misleading on pace |
| 3 | Fatigue comparison is metric-direction-aware | Cadence up = good (green), GCT/VR/HR up = bad (red). Each metric has a `higher_is_better` flag |
| 4 | Use Garmin's per-activity HR zone data instead of user profile zones | Profile zones are static; per-activity zones from `get_activity_hr_in_timezones` are more accurate |
| 5 | FIT timestamps are UTC — append `Z` for correct local time conversion in JS | Without this, dates displayed one day off |
| 6 | Use Garmin activity ID (not filename) for deduplication | Filename-based IDs caused format mismatches and duplicates |
| 7 | Fetch 3x requested activities before filtering to running-only | Garmin returns all activity types; need headroom to get enough runs |
| 8 | Remove SSL extraction (Step Speed Loss) | Undocumented HRM-600 field mapping (`unknown_325`) was incorrect — removed rather than ship bad data |

## Artifact Detection

| # | Decision | Context |
|---|----------|---------|
| 9 | Artifact thresholds: cadence < 120 spm, speed < 2.0 km/h, pace > 8:00/km, GCT > 300ms, power = 0 | Identifies stop/pause points in FIT data |
| 10 | Workout-aware artifact detection: recovery segments preserved as `RECOVERY`, not `STOP_ARTIFACT` | When `--workout-data` is provided, planned rest intervals aren't flagged as artifacts |
| 11 | Recovery period shading on charts — gray bands during non-running periods | Visual context for intervals; only label first recovery to avoid clutter |
| 12 | Filter recovery data from running-only statistics | Averages should reflect running effort, not rest periods |

## Grading System

| # | Decision | Context |
|---|----------|---------|
| 13 | A/B/C/D grading for biomechanical metrics (cadence, GCT, GCT balance, vertical ratio) | Simple letter grades are more actionable than raw numbers |
| 14 | Grade badges (CAD, GCT, BAL, V.R) shown on activity list cards | At-a-glance quality assessment without opening the activity |
| 15 | Expandable metric cards with grade thresholds and coaching tips | Tapping a grade explains what it means and how to improve |

## App Structure & Navigation

| # | Decision | Context |
|---|----------|---------|
| 16 | Four-tab activity detail: Summary, Charts, Laps, Coaching | Single scroll was too long; tabs let users jump to what they care about |
| 17 | Workout compliance on Summary tab, fatigue analysis on Coaching tab | Compliance is a key summary stat; fatigue is coaching insight |
| 18 | Settings as header gear icon, not a tab bar item | Settings is infrequent — doesn't deserve permanent tab space |
| 19 | Three main tabs: Home, Activities, Analyze | Core navigation loop |
| 20 | Emoji icons on activity detail tabs | Visual differentiation for Summary/Charts/Laps/Coaching |
| 21 | Activity type badges (Treadmill, Trail, Track) on detail header and cards | Quick identification of run type from `sub_sport` FIT field |

## Authentication & Deployment

| # | Decision | Context |
|---|----------|---------|
| 22 | Stateless auth — tokens stored on device, passed via Authorization header | Enables Render free tier (no persistent server-side storage) |
| 23 | Client-side Garmin auth with MFA support | Full login flow in the app, not a separate web portal |
| 24 | Cache sync response directly instead of refetching from GET /activities | Render free tier has ephemeral storage — FIT files don't persist between requests |
| 25 | Persist activities to AsyncStorage for offline access | Don't lose data when backend is cold or unreachable |
| 26 | No auto-sync on mount | Prevents duplicate API calls when navigating between tabs |

## Charts & Visualization

| # | Decision | Context |
|---|----------|---------|
| 27 | GCT Balance chart with 49-51% ideal zone shading | Visual target range for left/right balance |
| 28 | Cadence-GCT scatter plot with linear regression | Shows biomechanical correlation between cadence and ground contact |
| 29 | 15-point rolling average smoothing on time series charts | Reduces noise while preserving trends |
| 30 | Interactive Skia charts with touch scrubbing | Native feel for exploring time series data |
| 31 | Merge analyze-run and report into unified HTML output | Single command produces both analysis and interactive Plotly charts |

## Tools

| # | Decision | Context |
|---|----------|---------|
| 32 | Glucose converter (mmol/L ↔ mg/dL) as standalone tool | Quick reference utility |
| 33 | Pace converter with auto-updating fields (speeds, paces, race times) | All fields recalculate when any value changes |

## Naming & Branding

| # | Decision | Context |
|---|----------|---------|
| 34 | App name: Atlas (previously "Tristan's Toolkit") | More professional; reflects mapping your running journey |

## Code Organization

| # | Decision | Context |
|---|----------|---------|
| 35 | Extract all inline StyleSheet.create to separate `.styles.ts` files | Cleaner components; styles in `src/styles/` not `app/` (Expo Router treats `app/` files as routes) |
| 36 | Pre-commit hook with ruff for Python linting | Automated code quality on every commit |

## Workout Compliance

| # | Decision | Context |
|---|----------|---------|
| 37 | Parse nested RepeatGroupDTO structures, flatten repeat iterations | 4x interval becomes 4 individual steps for accurate per-step compliance |
| 38 | Steps without pace targets check distance compliance instead | Warmup/cooldown steps are "hit" if actual distance >= target |
| 39 | Show compliance error banner when auth expires or workout not found | Orange warning instead of silently hiding compliance |
| 40 | Fallback workout matching by name/distance when calendar returns null | Calendar API sometimes misses; try alternative lookup |
