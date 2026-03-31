# Product Decisions

Living document of decisions that have shaped the product direction. Update as new decisions are made.

---

## Data & Accuracy

| #   | Decision                                                                            | Context                                                                                                                             |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Use `total_timer_time` (active running) for duration/pace, not `total_elapsed_time` | Elapsed includes pauses/rest between intervals — inflated times and slow paces                                                      |
| 2   | Show elapsed duration in parentheses when different from active duration            | Gives context on rest periods without misleading on pace                                                                            |
| 3   | Fatigue comparison is metric-direction-aware                                        | Cadence up = good (green), GCT/VR/HR up = bad (red). Each metric has a `higher_is_better` flag                                      |
| 4   | Use Garmin's per-activity HR zone data instead of user profile zones                | Profile zones are static; per-activity zones from `get_activity_hr_in_timezones` are more accurate                                  |
| 5   | FIT timestamps are UTC — append `Z` for correct local time conversion in JS         | Without this, dates displayed one day off                                                                                           |
| 6   | Use Garmin activity ID (not filename) for deduplication                             | Filename-based IDs caused format mismatches and duplicates                                                                          |
| 7   | Fetch `limit + 5` (capped at 30) activities before filtering to running-only        | Originally 3x, reduced to prevent Garmin API rate limiting while still providing enough headroom for non-running filtering          |
| 8   | Remove SSL extraction (Step Speed Loss)                                             | Undocumented HRM-600 field mapping (`unknown_325`) was incorrect — removed rather than ship bad data                                |
| 9   | Remove heart rate from fatigue comparison                                           | Cardiac drift (HR rising over time) is physiologically inevitable in every run — flagging it as "degraded" is noise, not actionable |

## Artifact Detection

| #   | Decision                                                                                         | Context                                                                               |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 10  | Artifact thresholds: cadence < 120 spm, speed < 2.0 km/h, pace > 8:00/km, GCT > 300ms, power = 0 | Identifies stop/pause points in FIT data                                              |
| 11  | Workout-aware artifact detection: recovery segments preserved as `RECOVERY`, not `STOP_ARTIFACT` | When `--workout-data` is provided, planned rest intervals aren't flagged as artifacts |
| 12  | Recovery period shading on charts — gray bands during non-running periods                        | Visual context for intervals; only label first recovery to avoid clutter              |
| 13  | Filter recovery data from running-only statistics                                                | Averages should reflect running effort, not rest periods                              |

## Grading System

| #   | Decision                                                                              | Context                                                     |
| --- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 14  | A/B/C/D grading for biomechanical metrics (cadence, GCT, GCT balance, vertical ratio) | Simple letter grades are more actionable than raw numbers   |
| 15  | Grade badges (CAD, GCT, BAL, V.R) shown on activity list cards                        | At-a-glance quality assessment without opening the activity |
| 16  | Expandable metric cards with grade thresholds and coaching tips                       | Tapping a grade explains what it means and how to improve   |

## App Structure & Navigation

| #   | Decision                                                                  | Context                                                                                                                      |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 17  | Four-tab activity detail: Summary, Charts, Laps, Coaching                 | Single scroll was too long; tabs let users jump to what they care about                                                      |
| 18  | Workout compliance on Summary tab, fatigue analysis on Coaching tab       | Compliance is a key summary stat; fatigue is coaching insight                                                                |
| 19  | Settings as header gear icon, not a tab bar item                          | Settings is infrequent — doesn't deserve permanent tab space                                                                 |
| 20  | Three main tabs: Home, Runs, New                                          | Core navigation loop — "New" replaces "Analyze" to avoid label truncation                                                    |
| 21  | Ionicons throughout (tab bars, quick actions, tools)                      | Replaced emoji with @expo/vector-icons for consistent rendering, proper active/inactive tinting, and professional appearance |
| 22  | Activity type badges (Treadmill, Trail, Track) on detail header and cards | Quick identification of run type from `sub_sport` FIT field                                                                  |

## Authentication & Deployment

| #   | Decision                                                                  | Context                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23  | Stateless auth — tokens stored on device, passed via Authorization header | Enables Render free tier (no persistent server-side storage)                                                                                                                                                                                         |
| 24  | Client-side Garmin auth with MFA support                                  | Full login flow in the app, not a separate web portal                                                                                                                                                                                                |
| 25  | Cache sync response directly instead of refetching from GET /activities   | Render free tier has ephemeral storage — FIT files don't persist between requests                                                                                                                                                                    |
| 26  | Persist activities to AsyncStorage for offline access                     | Don't lose data when backend is cold or unreachable                                                                                                                                                                                                  |
| 27  | No auto-sync on mount                                                     | Prevents duplicate API calls when navigating between tabs                                                                                                                                                                                            |
| 28  | Multi-layer rate limit protection for Garmin API                          | Deployed APK hit 429s that local dev didn't — added backend sync cooldown (60s per-user), client-side debounce (30s), exponential backoff with Retry-After support, disabled aggressive auto-refetch, and throttled FIT download bursts (0.5s delay) |
| 29  | Centralize all API calls through `fetchJson` with retry wrapper           | `syncActivities` and `fetchActivityDetails` previously used raw `fetch()`, bypassing error handling and retry logic — refactored to use the shared `fetchJson` helper                                                                                |
| 30  | Cache HR zones to disk alongside FIT files                                | Activity detail endpoint was hitting Garmin API for HR zones on every view — now cached as `.hrzones.json` next to the FIT file, matching the existing compliance cache pattern                                                                      |
| 31  | Suppress sync banner when `synced === 0`                                  | Backend cooldown returns a valid SyncResponse with zero activities — showing "Sync available in 54s" as a success banner confused users                                                                                                              |
| 32  | Retry with exponential backoff on Garmin OAuth endpoints                  | Garmin rate-limits cloud provider IPs (Render/AWS) more aggressively than residential — `login()` and `resume_login()` wrapped with 2s/4s/8s backoff on 429, with friendly user-facing error messages                                                |
| 56  | Auto-logout on 401 responses via event emitter pattern                    | `fetchJson` clears tokens and notifies `AuthContext` on 401, triggering automatic redirect to login instead of generic error messages                                                                                                                |
| 57  | Client-side token expiry validation using `oauth2_expires_at`             | `isAuthenticated()` checks expiry timestamp before returning true — proactively detects stale tokens instead of waiting for API failures                                                                                                             |
| 58  | MFA submission routed through `fetchJson` auth wrapper                    | Previously used raw `fetch` without auth headers — consolidated through the shared API client for consistent error handling and retry logic                                                                                                          |
| 62  | Pre-capture CSRF token during login for MFA flow                          | `garth.sso.handle_mfa()` reads CSRF from `client.last_resp.text`, which gets GC'd between the login and MFA requests — extract it immediately during `/garmin/login` and monkey-patch it back in during `/garmin/mfa`                                |

## Charts & Visualization

| #   | Decision                                                                 | Context                                                                                                                                                    |
| --- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 33  | GCT Balance chart with 49-51% ideal zone shading                         | Visual target range for left/right balance                                                                                                                 |
| 34  | Cadence-GCT scatter plot with linear regression                          | Shows biomechanical correlation between cadence and ground contact                                                                                         |
| 35  | 15-point rolling average smoothing on time series charts                 | Reduces noise while preserving trends                                                                                                                      |
| 36  | Interactive Skia charts with touch scrubbing                             | Native feel for exploring time series data                                                                                                                 |
| 59  | Binary search (O(log n)) for chart touch handlers instead of linear scan | Touch-drag on charts was doing O(n) linear scan per move event — replaced with binary search on sorted timestamps for smooth scrubbing with large datasets |
| 60  | `useWindowDimensions` hook instead of static `Dimensions.get("window")`  | Three chart components captured screen width at module load time — wouldn't update on device rotation or split-screen                                      |
| 37  | Merge analyze-run and report into unified HTML output                    | Single command produces both analysis and interactive Plotly charts                                                                                        |

## Tools

| #   | Decision                                                             | Context                                       |
| --- | -------------------------------------------------------------------- | --------------------------------------------- |
| 38  | Glucose converter (mmol/L ↔ mg/dL) as standalone tool                | Quick reference utility                       |
| 39  | Pace converter with auto-updating fields (speeds, paces, race times) | All fields recalculate when any value changes |

## Naming & Branding

| #   | Decision                                         | Context                                                  |
| --- | ------------------------------------------------ | -------------------------------------------------------- |
| 40  | App name: Atlas (previously "Tristan's Toolkit") | More professional; reflects mapping your running journey |

## Code Organization

| #   | Decision                                                                       | Context                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 41  | Extract all inline StyleSheet.create to separate `.styles.ts` files            | Cleaner components; styles in `src/styles/` not `app/` (Expo Router treats `app/` files as routes)                                                           |
| 42  | Pre-commit hook with ruff for Python linting                                   | Automated code quality on every commit                                                                                                                       |
| 52  | Shared `src/utils/formatters.ts` for date, pace, duration, distance formatting | Consolidated 6+ duplicate format functions across screens and components into a single source of truth — also fixed a fractional-seconds bug in ActivityCard |
| 53  | Shared `src/utils/chartUtils.ts` for smoothData and binary search              | Chart data processing (rolling average, nearest-point lookup) extracted from InteractiveRunChart and GCTBalanceChart                                         |
| 54  | `ChartErrorBoundary` wrapping all Skia charts                                  | Skia render errors crashed the entire app — error boundary contains failures to individual chart sections                                                    |
| 55  | Single sync API via `useSyncActivities` hook, removed duplicate from `api.ts`  | Settings screen was calling `api.syncActivities` directly, bypassing TanStack Query cache — activities list didn't update after sync from settings           |

## Workout Compliance

| #   | Decision                                                              | Context                                                                 |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 43  | Parse nested RepeatGroupDTO structures, flatten repeat iterations     | 4x interval becomes 4 individual steps for accurate per-step compliance |
| 44  | Steps without pace targets check distance compliance instead          | Warmup/cooldown steps are "hit" if actual distance >= target            |
| 45  | Show compliance error banner when auth expires or workout not found   | Orange warning instead of silently hiding compliance                    |
| 46  | Fallback workout matching by name/distance when calendar returns null | Calendar API sometimes misses; try alternative lookup                   |

## Design & Polish

| #   | Decision                                                                 | Context                                                                                                                                    |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 47  | Warm off-white palette (#F8F7F4 background, #FEFEFE cards, tinted grays) | Pure white/gray felt sterile — subtle warmth adds personality without a rebrand                                                            |
| 48  | Activity card left border colored by overall grade                       | Enables at-a-glance trend scanning on the Activities list without reading each badge                                                       |
| 49  | Hero metrics at 32px/800 weight on Summary screen                        | Creates clear visual hierarchy — distance/time/pace anchor the page                                                                        |
| 50  | Cadence chart reference zone band (170-180 spm)                          | Raw line charts lack context — shaded zones give immediate meaning, matching the glucose chart pattern                                     |
| 51  | Consolidated empty state with onboarding CTA                             | Three separate CTAs for the same action (get data) caused confusion — single prominent CTA when no data exists                             |
| 61  | `useCallback` with proper deps in `useBackendStatus`                     | Health check polling used closures captured in `setInterval` — stale refs meant disconnect/reconnect state transitions could silently fail |
