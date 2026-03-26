# Atlas: Interview Preparation Guide

> **Note:** This document is for personal interview prep and should NOT be committed to the repository.

This document is a comprehensive guide to the Atlas project, designed to prepare for technical interviews. It covers architecture, technical decisions, challenges, and provides answers to common questions.

## 1. Project Overview

**The Elevator Pitch:** Atlas is a React Native mobile app for runners that acts as an intelligent training partner. It syncs with Garmin Connect to provide deep biomechanical analysis from running dynamics data, tracks workout compliance against scheduled plans, and offers actionable coaching insights to help athletes improve their form and efficiency.

**Core Features:**

- **Garmin Connect Integration:** Securely authenticates with a user's Garmin account (including full MFA support) to automatically sync running activities.
- **Advanced Biomechanics Analysis:** Parses raw FIT files to extract and analyze key running dynamics metrics from sensors like the HRM-Pro, including Cadence, Ground Contact Time (GCT), GCT Balance, and Vertical Ratio.
- **Performance Grading:** Each core metric is graded on an A-D scale against established optimal ranges, providing an at-a-glance summary of performance.
- **Workout Compliance:** For users with structured workouts, the app compares the completed activity against the scheduled plan, showing how well they hit their pace and duration targets for each segment.
- **Fatigue Analysis:** Detects performance degradation by comparing biomechanics in the first half of a run versus the second half. Each metric is direction-aware (cadence up = good, GCT up = bad). Heart rate is intentionally excluded since cardiac drift is physiologically inevitable and not actionable.
- **Actionable Coaching:** Translates raw data into simple, human-readable insights, highlighting what went well, areas for improvement, and a specific focus cue for the next run.
- **Glucose/CGM Tracking:** Extracts continuous glucose monitor data from FIT files and renders interactive charts with reference zone bands showing the "good zone," plus summary statistics on the activity overview.
- **Best Efforts:** Calculates and displays a runner's best moving times at standard race distance milestones (1K, 1 mile, 5K, etc.) for each activity.
- **Connection Status:** Real-time backend health monitoring with a smart connection banner that auto-detects dev/prod environments, polls the health endpoint, and shows connecting/connected/disconnected states.

**Tech Stack:**

| Category         | Technology                      | Rationale                                                                                                         |
| :--------------- | :------------------------------ | :---------------------------------------------------------------------------------------------------------------- |
| **Mobile App**   | React Native (Expo)             | Cross-platform development with a mature ecosystem.                                                               |
| **Server State** | TanStack Query                  | Declarative data fetching, caching, and background sync. Simplifies loading/error states.                         |
| **UI State**     | React Context                   | Built-in React API for sharing auth and connection state across the component tree without extra dependencies.    |
| **Charts**       | React Native Skia               | GPU-accelerated 2D graphics for fluid, 60fps interactive charts with large datasets.                              |
| **Icons**        | Ionicons (`@expo/vector-icons`) | Consistent rendering with proper active/inactive tinting; replaced emoji for professional appearance.             |
| **Lists**        | `@shopify/flash-list`           | High-performance, virtualized lists for smooth scrolling of activity history.                                     |
| **Backend API**  | FastAPI (Python 3.11)           | High-performance async framework that allows reusing Python's excellent data analysis libraries.                  |
| **Garmin API**   | `garminconnect` library         | Handles the complex authentication and data fetching from Garmin's private API.                                   |
| **Deployment**   | Docker & Render                 | Containerized backend for consistency and easy, scalable deployment on Render.                                    |
| **Color System** | Centralized theme tokens        | Single source of truth for all colors (`theme/colors.ts`); warm off-white palette with Material Design 3 accents. |

---

## 2. Architecture & Key Decisions

The application follows a standard client-server architecture with a clear separation of concerns. The React Native app is the presentation layer, while the FastAPI backend handles all business logic, data processing, and third-party integrations.

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Mobile App        │────▶│   FastAPI Backend   │────▶│  Garmin Connect API │
│   (React Native)    │◀────│   (Render)          │◀────│                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │
         │                           │
    Stores tokens              Stateless
    locally (secure)           (no persistence)
```

### Decision: Why a Stateless FastAPI Backend?

The backend is intentionally designed to be stateless. It doesn't use a database or store any user session information.

- **Rationale:**
  1. **Scalability & Simplicity:** Stateless services are easy to scale horizontally. Any instance of the app can serve any user's request, which is perfect for serverless platforms like Render. It also eliminates the complexity of database management, migrations, and backups.
  2. **Security:** User credentials and session tokens are never stored on the server. They are stored securely on the user's device using `expo-secure-store` and passed with each API request. This reduces the attack surface area on the backend.
  3. **Leveraging Python's Strengths:** The core analysis logic relies on Python libraries for FIT file parsing. FastAPI was the ideal choice to build a modern, high-performance API wrapper around these existing scripts. This project started as a set pf python scripts i ran on my laptop against manually downloaded data.

### Decision: Stateless Authentication & Token Management

Authentication is handled via a token-passing mechanism.

- **How it Works:**
  1. The user logs in through the app. The mobile client sends credentials to the backend's `/auth/garmin/login` endpoint.
     - _Reference:_ [`AuthContext.tsx:67-71`](mobile/src/contexts/AuthContext.tsx#L67) — login method with MFA detection
  2. The backend authenticates with Garmin and receives session tokens.
     - _Reference:_ [`auth.py:68`](backend/app/routers/auth.py#L68) — `Garmin(email, password, return_on_mfa=True)`
  3. These tokens are immediately returned to the mobile app, which stores them in `expo-secure-store`. The backend discards them.
     - _Reference:_ [`garmin_sync.py:117`](backend/app/services/garmin_sync.py#L117) — `self.garmin.garth.dump(self.token_path)` serializes tokens
     - _Reference:_ [`authService.ts:80-81`](mobile/src/services/authService.ts#L80) — `storeTokens()` persists to hardware-backed secure store
  4. For subsequent requests to protected endpoints (like `/activities/sync`), the mobile app retrieves the tokens, encodes them, and sends them in the `Authorization: Bearer <token>` header.
     - _Reference:_ [`authService.ts:52-59`](mobile/src/services/authService.ts#L52) — `getAuthHeader()` retrieves and formats Bearer token
  5. The backend decodes these tokens into a temporary directory to initialize the Garmin API client for the duration of that single request. This is handled by the `decode_tokens_to_dir` dependency.
     - _Reference:_ [`auth.py:20-60`](backend/app/dependencies/auth.py#L20) — base64 decode → tar.gz extraction → token file verification

### Decision: Why TanStack Query for Server State?

TanStack Query is the backbone of the mobile app's data layer. It's more than just a data fetching library; it's a server-state management tool.

- **Rationale:**
  1. **Declarative Approach:** It abstracts away the complexities of managing loading, error, and success states. Components simply subscribe to a query, and TanStack Query handles the lifecycle.
  2. **Powerful Caching:** It provides aggressive and configurable caching out of the box. This makes the app feel fast and responsive, and reduces unnecessary network requests. I use `staleTime` to serve cached data first while a background refetch happens.
     - _Reference:_ [`useActivities.ts:205`](mobile/src/hooks/useActivities.ts#L205) - `staleTime: 5 * 60 * 1000`
  3. **Automatic Refetching:** It automatically refetches data on events like window focus or network reconnection, ensuring the user sees fresh data without manual intervention.
  4. **Mutation Management:** It simplifies handling data mutations (like syncing activities), providing clear `onSuccess` and `onError` callbacks to update the UI and invalidate cached data.
  5. On a personal note it was a tech i have not used before but have heard of so i was interested in having a go with it.

---

## 3. Technical Deep Dives

### How Garmin OAuth & MFA Works

The Garmin API is unofficial and requires mimicking the web login flow. This includes a multi-step OAuth process and support for MFA.

1. **Initial Login:** The backend initiates a login with username and password.
   - _Reference:_ [`auth.py:68`](backend/app/routers/auth.py#L68) — `Garmin(email, password, return_on_mfa=True)`
2. **MFA Detection:** The `garminconnect` library is configured with `return_on_mfa=True`. If Garmin requires MFA, the login process pauses and returns a special status.
   - _Reference:_ [`auth.py:79,89`](backend/app/routers/auth.py#L79) — MFA session stored in `_pending_mfa` dict (line 23)
3. **Backend Response:** My backend catches this state and, instead of an error, returns a `200 OK` response with a specific JSON body: `{ "mfa_required": true, "message": "..." }`.
   - _Reference:_ [`activities.py:50-53`](backend/app/routers/activities.py#L50) — `MFARequiredResponse` model
4. **Frontend Handling:** The `useSyncActivities` hook in the mobile app receives this response. The `isMFARequired` type guard checks the response shape. If it's true, the hook's `onSuccess` callback triggers UI state to show an MFA input modal to the user.
   - _Reference:_ [`useActivities.ts:23`](mobile/src/hooks/useActivities.ts#L23) — `isMFARequired` type guard (moved from api.ts to co-locate with hooks)
   - _Reference:_ [`useActivities.ts:228`](mobile/src/hooks/useActivities.ts#L228) — `onSuccess` handler
5. **MFA Submission:** The user enters the code, which is sent to a separate `/activities/mfa` endpoint. The backend uses the `garminconnect` library's `resume_login` function to complete the authentication.
   - _Reference:_ [`auth.py:140`](backend/app/routers/auth.py#L140) — `garmin.resume_login(client_state, code)`
6. **Retry Sync:** After a successful MFA submission, the mobile app automatically re-triggers the original sync request, which now succeeds.

### How FIT File Parsing & Grading Works

The "magic" of the app happens in the backend's parsing service.

1. **Sync & Download:** When a sync is triggered, the `garmin_sync.py` service downloads the activity's original `.fit` file from Garmin and saves it locally on the server's ephemeral storage.
   - _Reference:_ [`garmin_sync.py:333-369`](backend/app/services/garmin_sync.py#L333) — `download_activity_fit()` function
2. **Parsing:** When the user requests activity details, the `/activities/{id}` endpoint calls the `parse_fit_file` service. This service uses the `fitparse` library to iterate through the binary FIT file, which contains a stream of data messages.
   - _Reference:_ [`fit_parser.py:68-115`](backend/app/services/fit_parser.py#L68) — `parse_fit_file()` entry point
3. **Data Extraction:** It listens for `record` messages, which contain time-series data like `timestamp`, `cadence`, `heart_rate`, and developer fields for running dynamics (GCT, Vertical Ratio, etc.).
   - _Reference:_ [`fit_parser.py:207`](backend/app/services/fit_parser.py#L207) — `for record in fitfile.get_messages("record"):`
   - _Reference:_ [`fit_parser.py:207-252`](backend/app/services/fit_parser.py#L207) — field mapping (cadence, stance_time, stance_time_balance, vertical_ratio, glucose_level)
4. **Calculation & Grading:** After extracting all data points, the service calculates averages and splits the data into first and second halves for fatigue analysis. It then applies the grading logic based on predefined thresholds.
   - _Reference:_ [`fit_parser.py:17-21`](backend/app/services/fit_parser.py#L17) — `GRADES` dict with threshold constants
   - _Reference:_ [`fit_parser.py:36-65`](backend/app/services/fit_parser.py#L36) — `grade_metric()` function (handles higher/lower-is-better)
   - _Reference:_ [`fit_parser.py:408-449`](backend/app/services/fit_parser.py#L408) — `compute_fatigue_comparison()` with `higher_is_better` flag (lines 391-408)

**Grading Thresholds:**

| Metric         | A       | B       | C       | D      |
| -------------- | ------- | ------- | ------- | ------ |
| Cadence        | >=180   | >=170   | >=160   | <160   |
| GCT            | <=220ms | <=250ms | <=280ms | >280ms |
| GCT Balance    | +/-1%   | +/-2%   | +/-4%   | >4%    |
| Vertical Ratio | <=8%    | <=9%    | <=10%   | >10%   |

### How Workout Compliance is Calculated

This feature provides immense value by telling a user if they successfully completed their coach-prescribed workout.

1. **Fetching the Plan:** When a user views an activity detail, the backend makes a call to Garmin using the activity's start time to find the _scheduled_ workout on the user's calendar. This is a complex lookup that involves several fallbacks, including matching by activity name and distance if a direct link isn't found.
   - _Reference:_ [`garmin_sync.py:531-547`](backend/app/services/garmin_sync.py#L531) — calendar lookup in `get_scheduled_workout()`
   - _Reference:_ [`garmin_sync.py:442-500`](backend/app/services/garmin_sync.py#L442) — `_match_workout_by_name()` fallback
2. **Parsing the Workout:** The scheduled workout data from Garmin contains a structured list of steps, each with a target (e.g., "run 1.6km at 4:15-4:30/km pace").
   - _Reference:_ [`garmin_sync.py:384-396`](backend/app/services/garmin_sync.py#L384) — `extract_steps()` handling nested `RepeatGroupDTO` structures
3. **Comparing Laps to Steps:** The `calculate_workout_compliance` service in the backend intelligently maps the _actual_ laps from the FIT file to the _planned_ steps from the workout.
   - _Reference:_ [`workout_compliance.py:40-68`](backend/app/services/workout_compliance.py#L40) — `calculate_step_compliance()` per-step scoring
4. **Scoring:** Each lap is compared against its corresponding step's target pace and duration/distance. It's then marked as "hit," "partial," or "missed." This data is aggregated to produce an overall compliance percentage and a detailed breakdown table for the user.
   - _Reference:_ [`workout_compliance.py:73-97`](backend/app/services/workout_compliance.py#L73) — pace range compliance with 5% tolerance (line 89)
   - _Reference:_ [`workout_compliance.py:367-371`](backend/app/services/workout_compliance.py#L367) — overall `compliance_pct` calculation
5. **Skip Detection:** The system also detects _skipped_ workout steps by analyzing FIT intensity and trigger fields. If a planned interval was never executed, it's flagged as "skipped" rather than "missed," giving the user an accurate picture of what they actually attempted versus what they chose to skip.
   - _Reference:_ [`workout_compliance.py:259-309`](backend/app/services/workout_compliance.py#L259) — `detect_skipped_steps()` function

### How Artifact Detection Works

When parsing FIT data, raw sensor readings include noise from stops, pauses, and recovery intervals that would skew averages and charts.

1. **Threshold-Based Detection:** Data points are flagged as artifacts when they fall below minimum thresholds: cadence < 120 spm, speed < 2.0 km/h, pace > 8:00/km, GCT > 300ms, or power = 0.
   - _Reference:_ [`fit_parser.py:56-62`](backend/app/services/fit_parser.py#L56) — artifact threshold constants
   - _Reference:_ [`InteractiveRunChart.tsx:61-67`](mobile/src/components/charts/InteractiveRunChart.tsx#L61) — `filterArtifacts()` client-side filtering
2. **Workout-Aware Recovery:** When workout data is available, planned rest intervals between sets are classified as `RECOVERY` rather than `STOP_ARTIFACT`. This preserves the structure of interval workouts.
   - _Reference:_ [`workout_compliance.py:277`](backend/app/services/workout_compliance.py#L277) — `skippable_types` list for recovery step classification
3. **Chart Visualization:** Recovery periods are rendered as gray shaded bands on time-series charts, providing visual context for intervals. Only the first recovery band is labeled to avoid clutter.
   - _Reference:_ [`InteractiveRunChart.tsx:146-165`](mobile/src/components/charts/InteractiveRunChart.tsx#L146) — reference zone / recovery band rendering
4. **Filtered Statistics:** Recovery and artifact data points are excluded from running-only statistics, so averages reflect actual running effort, not rest periods.
   - _Reference:_ [`InteractiveRunChart.tsx:61-67`](mobile/src/components/charts/InteractiveRunChart.tsx#L61) — `filterArtifacts()` removes stop artifacts before computing chart data

### How Glucose/CGM Integration Works

Atlas extracts continuous glucose monitor (CGM) data directly from FIT files recorded by compatible devices.

1. **Data Extraction:** During FIT file parsing, the backend looks for glucose-level data records alongside the standard running dynamics fields.
   - _Reference:_ [`fit_parser.py:248`](backend/app/services/fit_parser.py#L248) — `elif name == "glucose_level": data["glucoseLevel"] = value`
2. **Chart Rendering:** Glucose data is rendered as an interactive Skia chart with the same touch-scrubbing interface as other metrics. A reference zone band highlights the "good zone" range, giving immediate visual context.
   - _Reference:_ [`InteractiveRunChart.tsx:146-165`](mobile/src/components/charts/InteractiveRunChart.tsx#L146) — reference zone band rendering
   - _Reference:_ [`InteractiveRunChart.tsx:100-224`](mobile/src/components/charts/InteractiveRunChart.tsx#L100) — Skia chart with PanResponder touch scrubbing
3. **Summary Statistics:** Key glucose stats (average, min, max) are displayed on the activity overview tab alongside pace and heart rate summaries.

---

## 4. Challenges & Solutions

### Challenge: Handling Duplicate or Mismatched Activities

**Problem:** During development, I noticed that syncing would sometimes create duplicate entries. A single run could appear as `21487950438.fit` (from an initial sync) and later as `2026-01-08_Tempo_Run_21487950438.fit` (if Garmin updated the activity name).

**Solution:** I implemented a robust deduplication strategy:

1. **Unique ID Extraction:** A utility function, `extract_garmin_id`, was created to parse the filename and reliably extract the numerical Garmin activity ID, regardless of the filename format.
   - _Reference:_ [`activities.py:116-130`](backend/app/routers/activities.py#L116) — `extract_garmin_id()` function
2. **Deduplication Logic:** When listing cached activities, I iterate through all `.fit` files but use a dictionary keyed by the extracted Garmin ID. I prefer the more descriptive (longer) filename, as it's more useful for workout matching.
   - _Reference:_ [`activities.py:148-156`](backend/app/routers/activities.py#L148) — prefers longer filename stem
3. **Frontend Merging:** The `mergeActivities` function in `useActivities.ts` uses both ID and normalized startTime for deduplication, intelligently combining properties (e.g., keeping cached grades if the new backend data doesn't have them yet).
   - _Reference:_ [`useActivities.ts:125`](mobile/src/hooks/useActivities.ts#L125)

### Challenge: Managing Token Refreshes in a Stateless Architecture

**Problem:** Garmin's session tokens expire and need to be refreshed. In a stateful app, the server could manage this transparently. In my stateless backend, the server has no memory of the tokens from one request to the next.

**Solution:** I implemented a cooperative client-server mechanism:

1. **Detection on Backend:** The `garth` library handles the refresh automatically. I store the initial token at the start of a request.
   - _Reference:_ [`garmin_sync.py:145-164`](backend/app/services/garmin_sync.py#L145) — `get_refreshed_tokens()` compares initial vs current access tokens
2. **Custom Header:** After the request to Garmin is complete, I compare the current token with the initial one. If they differ, a refresh occurred. The backend encodes the _new_ tokens and places them in a custom HTTP header, `X-Refreshed-Tokens`.
   - _Reference:_ [`activities.py:277,498`](backend/app/routers/activities.py#L277) — header set on response
3. **Client-Side Interceptor:** On the mobile app, `updateTokensIfRefreshed` is called after every authenticated API request. It checks for the `X-Refreshed-Tokens` header and updates `expo-secure-store` if present.
   - _Reference:_ [`authService.ts:93`](mobile/src/services/authService.ts#L93)

### Challenge: Garmin API Rate Limiting (429 Errors) in Production

**Problem:** The deployed APK was hitting 429 rate limit errors from Garmin's Connect API during sync, even though local development worked fine. The root cause was a combination of aggressive client-side polling, unbounded API calls, and zero throttling on both sides.

**Solution:** A multi-layer debounce and rate limiting strategy across both backend and mobile:

1. **Backend Sync Cooldown (60s):** Added an in-memory per-user cooldown to the `/activities/sync` endpoint. Uses a hashed Authorization header as the key. If a user syncs within 60s of their last sync, the endpoint returns immediately with `synced: 0` instead of hitting Garmin.
   - _Reference:_ [`activities.py:40`](backend/app/routers/activities.py#L40) - `_sync_cooldowns` dict
2. **Reduced Over-Fetching:** Changed from `limit * 3` to `min(limit + 5, 30)` when requesting activities from Garmin. The original 3x multiplier was requesting 30-60 activities when only 10-20 were needed.
   - _Reference:_ [`garmin_sync.py:230`](backend/app/services/garmin_sync.py#L230)
3. **Throttled FIT Downloads:** Added `time.sleep(0.5)` between individual FIT file downloads in `sync_latest`. Each download is a separate Garmin API call — without the delay, syncing 10 new activities fired 10 rapid-succession requests.
   - _Reference:_ [`garmin_sync.py:600`](backend/app/services/garmin_sync.py#L600)
4. **HR Zone Caching:** Activity detail requests were hitting Garmin for HR zones on every view. Added disk caching (`.hrzones.json` files) to match the existing compliance cache pattern.
   - _Reference:_ [`activities.py:95-105`](backend/app/routers/activities.py#L95)
5. **Client-Side Retry with Backoff:** Added `retryOn429` wrapper to `fetchJson` with exponential backoff (1s, 2s, 4s + jitter) and `Retry-After` header support.
   - _Reference:_ [`api.ts:40`](mobile/src/services/api.ts#L40)
6. **Consolidated API Calls:** Refactored `syncActivities` and `fetchActivityDetails` to use the shared `fetchJson` helper instead of raw `fetch()`, ensuring all API calls get retry protection. The sync API is now a single source of truth via the `useSyncActivities` hook — previously a duplicate existed in `api.ts` that the Settings screen called directly, bypassing the TanStack Query cache.
   - _Reference:_ [`useActivities.ts:178`](mobile/src/hooks/useActivities.ts#L178)
7. **Disabled Aggressive Polling:** Removed `refetchInterval` (was 5min) and `refetchOnWindowFocus` from `useActivities`. Added a 30s client-side cooldown on `handleRefresh` to prevent rapid pull-to-refresh.
   - _Reference:_ [`useActivities.ts:206`](mobile/src/hooks/useActivities.ts#L206), [`activities.tsx:46`](<mobile/app/(tabs)/activities.tsx#L46>)

8. **OAuth Retry with Backoff:** Garmin's SSO endpoint (`connectapi.garmin.com/oauth-service/oauth/preauthorized`) rate-limits cloud provider IPs more aggressively than residential. Wrapped `login()` and `resume_login()` with exponential backoff (2s, 4s, 8s) and surfaced friendly "please wait" messages instead of raw Garmin error strings.
   - _Reference:_ [`auth.py:14`](backend/app/routers/auth.py#L14) - `retry_garmin_call` import

**Key Insight:** The root cause was invisible locally because a single developer hitting Garmin's API from a residential IP never triggers rate limits. In production on Render (AWS infrastructure), Garmin applies stricter rate limits to cloud provider IP ranges. This affected both the sync flow (multiple cascading API calls) and the OAuth flow (login/MFA). I confirmed this by examining Render logs via the Render API — login succeeded (200) but MFA consistently failed (500 wrapping a Garmin 429) from the same server instance, ruling out multi-instance routing issues.

---

## 5. Code Quality & Best Practices

- **Type Safety:** Full TypeScript on the frontend with strict mode. Pydantic models on the backend ensure API contracts are enforced.
  - _Reference:_ `mobile/src/types/index.ts` — ~207 lines of TypeScript interfaces
  - _Reference:_ `backend/app/models/` — Pydantic models mirroring frontend types
- **Error Handling:** FastAPI's `HTTPException` returns structured, meaningful errors. TanStack Query's `isError` and `error` properties enable declarative error UI states.
- **Separation of Concerns:** Business logic lives in hooks and services, not components. Components are purely presentational. Shared formatting utilities are consolidated in `src/utils/formatters.ts` and chart data processing in `src/utils/chartUtils.ts`.
- **Auth Resilience:** The API client intercepts 401 responses, clears stale tokens, and notifies `AuthContext` via an event emitter pattern — triggering automatic redirect to login. Client-side token expiry validation (`oauth2_expires_at`) proactively detects expired sessions.
  - _Reference:_ [`api.ts:113-115`](mobile/src/services/api.ts#L113) — 401 detection → `clearTokens()` + `notifyAuthExpired()`
  - _Reference:_ [`authService.ts:214-219`](mobile/src/services/authService.ts#L214) — `onAuthExpired` event emitter
  - _Reference:_ [`AuthContext.tsx:60-64`](mobile/src/contexts/AuthContext.tsx#L60) — auto-logout listener
- **Error Boundaries:** Chart components are wrapped in `ChartErrorBoundary` to contain Skia render failures to individual chart sections rather than crashing the entire app.
  - _Reference:_ [`ChartErrorBoundary.tsx`](mobile/src/components/charts/ChartErrorBoundary.tsx) — class component with fallback UI
- **Caching Strategy:** Multi-layer caching with TanStack Query (in-memory) + AsyncStorage (persistent) + backend compliance caching.
  - _Reference:_ [`activities.py:67-81`](backend/app/routers/activities.py#L67) — compliance caching (`.compliance.json`)
  - _Reference:_ [`activities.py:94-105`](backend/app/routers/activities.py#L94) — HR zone caching (`.hrzones.json`)
  - _Reference:_ [`useActivities.ts:27-49`](mobile/src/hooks/useActivities.ts#L27) — AsyncStorage persistence layer
- **Centralized Design Tokens:** All colors are extracted into a single `theme/colors.ts` file with typed exports (`ColorToken`), ensuring visual consistency and making palette changes a one-file operation.
- **CORS Configuration:** Backend allows cross-origin requests for development flexibility.
  - _Reference:_ [`main.py:27-37`](backend/app/main.py#L27) — CORSMiddleware setup

---

## 6. What I'd Do Differently / Future Improvements

1. **True Offline-First Experience:** `expo-sqlite` is already added as a dependency—the next step is migrating from `AsyncStorage` to a proper SQLite schema for storing full `ActivityDetails` payloads, making detail screens fully accessible offline.

2. **Background Syncing:** Use `expo-task-manager` for periodic background fetches, so new activities are available the moment the user opens the app.

3. **Backend Caching Layer:** Introduce **Redis** cache with short TTL for parsed FIT file results. Would significantly improve performance for frequently viewed activities.

4. **Push Notifications:** Notify users when new activities are synced or when they've achieved a personal best in a metric.

5. **More Comprehensive Testing:** Increase test coverage, add E2E tests with Detox, and implement visual regression testing for charts.

---

## 7. Common Interview Questions & Answers

### Q: "Can you walk me through the application's architecture?"

"Certainly. Atlas uses a client-server architecture with a React Native mobile app and a Python FastAPI backend. The key design principle is a strict separation of concerns: the mobile app is purely for presentation and user interaction, while the backend handles all the heavy lifting—authenticating with Garmin, parsing binary FIT files, and running the analysis.

A crucial decision was to make the backend completely stateless. It doesn't have a database. User session tokens are stored securely on the device and passed with each API call. This makes the backend simple, secure, and highly scalable, which is ideal for deploying on a platform like Render. On the frontend, I use TanStack Query to manage all server state, which gives us robust caching, background data synchronization, and a clean, declarative way to handle loading and error states."

### Q: "Why did you choose this specific tech stack?"

"The stack was chosen strategically to play to the strengths of each technology.

- For the **backend**, I chose **FastAPI** because the core task is data processing of FIT files, and Python's data analysis ecosystem is unparalleled. FastAPI allowed me to quickly build a high-performance, async API around my existing Python parsing scripts.
- For the **mobile app**, I used **React Native with Expo** for its development speed and cross-platform capabilities.
- The most critical choice on the frontend was **React Native Skia** for charts. Running analysis generates thousands of data points per activity. Skia renders directly on the GPU, allowing us to build fluid, 60fps interactive charts that can be scrubbed smoothly, which wouldn't be possible with SVG-based libraries.
- Finally, **TanStack Query** was chosen to manage server state. It drastically simplifies data fetching and caching logic, which let me build features like pull-to-refresh and sync-on-open with very little code."

### Q: "What was the most challenging technical problem you solved?"

"One of the most interesting challenges was ensuring my stateless backend could handle Garmin's session token refreshes. Since the backend has no memory between requests, I couldn't just update a session store.

My solution was a cooperative effort between the client and server. When the backend makes a call to Garmin and the session token is refreshed, it encodes the _new_ tokens and sends them back to the mobile app in a custom `X-Refreshed-Tokens` HTTP header.

- _Reference:_ [`garmin_sync.py:145-164`](backend/app/services/garmin_sync.py#L145) — `get_refreshed_tokens()` compares initial vs current access tokens
- _Reference:_ [`activities.py:277,498`](backend/app/routers/activities.py#L277) — sets `X-Refreshed-Tokens` header on response

On the mobile app, I have a piece of middleware in my API service that inspects every response. If it finds that header, it silently updates the tokens stored in the device's secure storage. This process is completely transparent to the user. It was a really elegant solution that allowed me to maintain a purely stateless architecture while still handling the reality of expiring third-party tokens.

- _Reference:_ [`authService.ts:93-100`](mobile/src/services/authService.ts#L93) — `updateTokensIfRefreshed()` checks header and updates secure store"

### Q: "How does the data flow when a user syncs their activities?"

"The flow is unidirectional and managed by TanStack Query.

1. The user pulls-to-refresh on the activity list screen. This calls the `mutate` function from our `useSyncActivities` hook.
   - _Reference:_ [`activities.tsx:46`](<mobile/app/(tabs)/activities.tsx#L46>) — 30s client-side cooldown check before triggering sync
2. The hook makes a `POST` request to the `/activities/sync` endpoint on my FastAPI backend, including the auth tokens in the header.
   - _Reference:_ [`useActivities.ts:178`](mobile/src/hooks/useActivities.ts#L178) — `syncActivities()` via `fetchJson`
3. The backend receives the request, decodes the tokens, and uses the `garmin_sync` service to fetch the latest activity list from the Garmin Connect API.
   - _Reference:_ [`activities.py:260-269`](backend/app/routers/activities.py#L260) — cooldown check with SHA256-hashed auth key (line 253)
   - _Reference:_ [`garmin_sync.py:230`](backend/app/services/garmin_sync.py#L230) — `min(limit + 5, 30)` reduced over-fetching
4. For each new run, it downloads the binary FIT file and saves it to its local temporary storage.
   - _Reference:_ [`garmin_sync.py:600`](backend/app/services/garmin_sync.py#L600) — `time.sleep(0.5)` throttle between downloads
5. The backend responds with a JSON array of summary data for the newly synced activities.
6. Back on the client, the `onSuccess` handler in the `useSyncActivities` hook receives this new data. It merges the new activities with the existing list in the TanStack Query cache.
   - _Reference:_ [`useActivities.ts:125-155`](mobile/src/hooks/useActivities.ts#L125) — `mergeActivities()` with ID + normalized startTime dedup
7. Because the activity list component is subscribed to this query, the update to the cache triggers an automatic re-render, and the user sees the new activities appear at the top of the list.
   - _Reference:_ [`useActivities.ts:241`](mobile/src/hooks/useActivities.ts#L241) — `saveCachedActivities()` persists to AsyncStorage after sync"

### Q: "What would you add or improve if you had another month?"

"With more time, I'd focus on enhancing the offline experience and performance.

First, I'd complete the migration from `AsyncStorage` to **Expo SQLite**, which is already added as a dependency. This would let me store the full, parsed details of every activity in a proper relational schema on the device, making the entire app, including the detailed charts, fully functional offline.

Second, I'd implement **background syncing** using Expo's Task Manager. This would allow the app to fetch new activities periodically, even when it's not open, so the data is always fresh for the user.

Finally, I'd add a **Redis cache** to the backend to store the results of FIT file parsing. This would make loading the details of an already-analyzed run instantaneous and reduce the computational load on the server."

### Q: "How did you handle rate limiting with the Garmin API?"

"This was a great real-world problem. My app worked perfectly in local development but started hitting 429 rate limit errors in production. The issue was that multiple client-side triggers — auto-refetch every 5 minutes, refetch on window focus, pull-to-refresh, and the sync button — could all fire within seconds of each other.

Each sync request triggered a cascade of Garmin API calls: fetching the activity list, downloading individual FIT files for each new activity, then fetching workout data and HR zones on the detail screen. A single user action could generate 15-20 Garmin API calls.

I solved this with a multi-layer approach. On the backend, I added a 60-second per-user sync cooldown using an in-memory dictionary keyed by a hash of the auth token. I also reduced my over-fetching multiplier, added delays between FIT file downloads, and cached HR zone data to disk.

On the mobile side, I wrapped my central `fetchJson` helper with an exponential backoff retry mechanism that respects the `Retry-After` header. I also consolidated all API calls through this single helper — I discovered that the sync and detail fetch functions were using raw `fetch()` and completely bypassing my error handling. Finally, I disabled aggressive auto-refetch and added a 30-second client-side cooldown on the refresh action.

I also discovered a second rate limiting vector: Garmin's OAuth SSO endpoint aggressively throttles cloud provider IPs. Login worked fine from my home network but consistently hit 429s from Render's AWS infrastructure. I confirmed this by pulling Render logs via their API — login returned 200 but the MFA `resume_login` call failed every time. The fix was adding retry with exponential backoff to the auth endpoints, plus surfacing friendly error messages so users know to wait rather than spam retry.

The key learning was that rate limiting requires defense in depth — you need protection at every layer because the problem compounds across multiple triggers and API call chains. And when debugging production-only issues, always verify your assumptions with actual server logs rather than guessing from client-side errors."

### Q: "How did you handle performance optimizations?"

"Performance was a key consideration, especially for the charts and lists.

- For the activity list, which could grow to hundreds of items, I used **`@shopify/flash-list`**. It's a performant virtualized list that recycles views, ensuring smooth scrolling regardless of the list size.
  - _Reference:_ [`activities.tsx:18`](<mobile/app/(tabs)/activities.tsx#L18>) — `import { FlashList } from "@shopify/flash-list"`
- For the data-heavy charts, I made the critical decision to use **React Native Skia**. Unlike SVG-based libraries, Skia is a 2D graphics engine that draws directly to the GPU. This allows me to render thousands of data points at a fluid 60 frames per second and enables complex interactions like real-time scrubbing without any lag. Touch handlers use **binary search** (`findNearestByTimestamp`) for O(log n) nearest-point lookup — originally these were O(n) linear scans that degraded during fast scrubbing. Charts also use `useWindowDimensions` instead of static `Dimensions.get("window")` to handle screen rotation.
  - _Reference:_ [`InteractiveRunChart.tsx:100-224`](mobile/src/components/charts/InteractiveRunChart.tsx#L100) — Skia GPU path rendering
  - _Reference:_ [`chartUtils.ts:42-58`](mobile/src/utils/chartUtils.ts#L42) — `findNearestByTimestamp()` binary search
  - _Reference:_ [`chartUtils.ts:17-38`](mobile/src/utils/chartUtils.ts#L17) — `smoothData()` 15-point rolling average
- For **artifact detection and data filtering**, I implemented a multi-threshold system that identifies stop points and recovery intervals in raw FIT data. This ensures my charts and averages only reflect actual running effort, which is critical for accurate grading and meaningful coaching insights.
  - _Reference:_ [`InteractiveRunChart.tsx:61-67`](mobile/src/components/charts/InteractiveRunChart.tsx#L61) — `filterArtifacts()` client-side
  - _Reference:_ [`fit_parser.py:56-62`](backend/app/services/fit_parser.py#L56) — backend artifact thresholds
- At the data layer, **TanStack Query's caching** is a major performance win. By serving stale data from the cache while refetching in the background, the app feels incredibly responsive to the user and minimizes network requests.
  - _Reference:_ [`_layout.tsx:18-22`](mobile/app/_layout.tsx#L18) — `staleTime: 5 * 60 * 1000`, `retry: 2`
  - _Reference:_ [`useActivities.ts:206`](mobile/src/hooks/useActivities.ts#L206) — `refetchInterval: false` (disabled aggressive polling)"

### Q: "Tell me about the authentication flow."

"I implemented a stateless authentication system that prioritizes security while keeping the backend simple.

When the user logs in, credentials are sent to the backend which authenticates with Garmin. The resulting OAuth tokens are immediately returned to the mobile app and stored in `expo-secure-store`, which uses hardware-backed encryption on both iOS and Android.

- _Reference:_ [`authService.ts:8`](mobile/src/services/authService.ts#L8) — `import * as SecureStore from "expo-secure-store"`
- _Reference:_ [`authService.ts:80-81`](mobile/src/services/authService.ts#L80) — `storeTokens()` to hardware-backed store

For every authenticated request, the app retrieves these tokens, base64-encodes them, and sends them in the Authorization header. The backend decodes them into a temporary directory, uses them for that single request, then cleans up.

- _Reference:_ [`authService.ts:52-59`](mobile/src/services/authService.ts#L52) — `getAuthHeader()` formats Bearer token
- _Reference:_ [`auth.py:20-60`](backend/app/dependencies/auth.py#L20) — `decode_tokens_to_dir()` base64 → tar.gz → temp dir

I also handle Garmin's MFA flow. When MFA is required, the backend returns a special response instead of an error. The mobile app detects this and shows an MFA input modal. The code is submitted to a separate endpoint, and on success, the original operation is automatically retried.

- _Reference:_ [`auth.py:23`](backend/app/routers/auth.py#L23) — `_pending_mfa` in-memory dict
- _Reference:_ [`useActivities.ts:23`](mobile/src/hooks/useActivities.ts#L23) — `isMFARequired()` type guard

For expired tokens, the API client intercepts 401 responses, clears the stale tokens from secure storage, and notifies the `AuthContext` via an event emitter. This triggers an automatic logout and redirect to the login screen — the user never sees a cryptic error. I also added client-side validation of the `oauth2_expires_at` timestamp, so the app can detect stale sessions proactively without waiting for an API failure.

- _Reference:_ [`api.ts:113-115`](mobile/src/services/api.ts#L113) — 401 → `clearTokens()` + `notifyAuthExpired()`
- _Reference:_ [`authService.ts:189`](mobile/src/services/authService.ts#L189) — `isAuthenticated()` checks expiry before returning true"

### Q: "How would you scale this beyond a single user?"

"Right now the backend uses in-memory Python dicts for MFA sessions (`_pending_mfa` — [`auth.py:23`](backend/app/routers/auth.py#L23)) and sync cooldowns (`_sync_cooldowns` — [`activities.py:40`](backend/app/routers/activities.py#L40)), and all FIT files land in a shared directory with no user namespacing. That's fine for a single-user take-home, but scaling requires addressing three things:

1. **Session state → Redis.** Move `_pending_mfa` and `_sync_cooldowns` into Redis with TTLs. This makes the backend horizontally scalable — any instance can serve any request — and survives container restarts.
2. **FIT file storage → S3/GCS with user-prefixed keys.** Right now two users could theoretically have colliding activity IDs in the same directory. Object storage with `user_id/activity_id.fit` paths solves this, adds durability, and enables CDN caching.
3. **Parsed results → Postgres.** Instead of re-parsing FIT files on every detail request, store the analysis output (grades, compliance, fatigue, best efforts) in a relational database. This also enables cross-activity analytics — trends over time, PR tracking, and training load calculations.
4. **Sync as a background job.** Move the Garmin sync from a synchronous API call to a task queue (Celery, or even a simple Redis-backed worker). Return a job ID immediately and let the client poll or use WebSocket for completion. This prevents request timeouts on large syncs.

The stateless token-passing design actually scales well — it's the in-memory state and shared filesystem that are the bottlenecks."

### Q: "Why no database? What are the tradeoffs?"

"The decision to skip a database was deliberate, driven by two constraints: deployment cost (Render free tier has no managed database) and development velocity for a time-boxed project.

**What I gain:** Zero ops overhead — no migrations, no connection pooling, no backup strategy. The backend is a pure compute layer: tokens in, analysis out. Deployment is a single Docker container.

**What I give up:**

- **No query history or analytics.** Can't answer 'show me my cadence trend over the last 3 months' without re-parsing every FIT file.
- **No cross-device access.** Activities are cached on the specific device that synced them. A new phone means re-syncing everything.
- **No server-side search or filtering.** The activity list is sorted by date only — no filtering by distance, grade, or workout type without client-side processing.
- **Ephemeral parsed results.** Every time Render restarts, cached FIT files and compliance JSONs are lost. The device cache mitigates this for the activity list, but detail views require a re-sync.

If I were building this for production, I'd add Postgres for parsed results and S3 for FIT files. The stateless auth design would stay — it's genuinely good — but the 'no persistence' constraint was a cost optimization, not an architectural ideal."

### Q: "Why did you exclude heart rate from fatigue comparison?"

"This is one of my favorite decisions because it shows domain-specific thinking over naive engineering. My initial implementation flagged HR increases in the second half as 'degraded,' which looked correct from a pure metrics standpoint.

But cardiac drift — heart rate rising over the course of a run even at constant effort — is physiologically inevitable. It happens due to core temperature increase, plasma volume loss, and sympathetic nervous system activation. Every single run of sufficient duration will show this pattern.

Flagging an inevitable phenomenon as a 'problem' creates noise, not signal. It would mean every run gets a fatigue warning for HR, which trains the user to ignore the fatigue section entirely. By removing HR, the remaining metrics (cadence dropping, GCT increasing, vertical ratio worsening) become genuinely actionable signals of form breakdown."

- _Reference:_ [`fit_parser.py:431-435`](backend/app/services/fit_parser.py#L431) — `metrics_config` tuple with `higher_is_better` flag per metric (HR excluded from list)

### Q: "Why `total_timer_time` instead of `total_elapsed_time`?"

"FIT files contain both fields. `total_elapsed_time` includes everything — pauses, rest between intervals, stopped at a traffic light. `total_timer_time` is just the active running time.

If you use elapsed time for pace calculations on an interval workout with 90-second recovery jogs, you get a misleadingly slow average pace. The timer time reflects the effort the runner actually put in.

I still show elapsed time in parentheses when it differs significantly from active time — this gives context on rest periods without distorting the primary metrics."

- _Reference:_ [`fit_parser.py:388`](backend/app/services/fit_parser.py#L388) — `scale = timer_time / elapsed_time` for best efforts moving-time conversion

### Q: "Why no tests? How would you approach testing this codebase?"

"This was a conscious scope decision for a time-boxed take-home project. I prioritized demonstrating architectural thinking, domain knowledge, and production-readiness patterns over test coverage.

That said, here's exactly how I'd layer in testing:

1. **Backend unit tests first** — highest ROI. The FIT parser's `grade_metric()` ([`fit_parser.py:36-65`](backend/app/services/fit_parser.py#L36)) and `compute_fatigue_comparison()` ([`fit_parser.py:408-449`](backend/app/services/fit_parser.py#L408)) are pure functions with clear inputs and outputs. Workout compliance scoring has edge cases (skipped steps at [`workout_compliance.py:259-309`](backend/app/services/workout_compliance.py#L259), partial hits, nested repeat groups at [`garmin_sync.py:384-396`](backend/app/services/garmin_sync.py#L384)) that are perfect for parameterized tests with pytest.
2. **API integration tests** — Use FastAPI's `TestClient` with fixture FIT files to test the full parse→grade→respond pipeline without hitting Garmin's API.
3. **Mobile component tests** — React Native Testing Library for the merge algorithm in `useActivities` ([`useActivities.ts:125-155`](mobile/src/hooks/useActivities.ts#L125)), the retry logic in `api.ts` ([`api.ts:40-58`](mobile/src/services/api.ts#L40)), and the auth state machine in `AuthContext` ([`AuthContext.tsx:29-113`](mobile/src/contexts/AuthContext.tsx#L29)).
4. **E2E tests** — Detox for critical user flows: login → sync → view activity → navigate detail tabs. These catch navigation and state management regressions that unit tests miss.

The fact that the codebase is structured with clear separation of concerns (pure services, hooks wrapping mutations, presentational components) means it's highly testable — the architecture was designed with testing in mind even if the tests aren't written yet."

### Q: "What's the security model? Why `expo-secure-store` over `AsyncStorage`?"

"The security model is built around minimizing the attack surface at every layer.

**Token storage:** `expo-secure-store` uses the iOS Keychain and Android Keystore — hardware-backed encryption that's resistant to device compromise. `AsyncStorage` stores data as unencrypted JSON on the filesystem, readable by any process with device access. For OAuth tokens that grant full access to a user's Garmin account, hardware-backed encryption is non-negotiable.

- _Reference:_ [`authService.ts:8`](mobile/src/services/authService.ts#L8) — `import * as SecureStore from "expo-secure-store"`
- _Reference:_ [`authService.ts:38,54,67,81,98`](mobile/src/services/authService.ts#L38) — all SecureStore read/write call sites

**Transport security:** Tokens travel as base64-encoded tar.gz in the Authorization header over HTTPS. Base64 is encoding, not encryption — but HTTPS provides the transport encryption. The alternative would be encrypting the payload with a shared secret, but that adds complexity without meaningful security gain over TLS.

**Server-side:** Tokens exist only for the duration of a single request. They're decoded into a temp directory, used to initialize the Garmin client, and cleaned up. No persistent storage means a server breach doesn't expose user credentials.

- _Reference:_ [`auth.py:40-46`](backend/app/dependencies/auth.py#L40) — base64 decode and tar.gz extraction to temp directory

**What's missing for production:** Token revocation (no way to invalidate a stolen token without server-side state), request signing (to prevent replay attacks), and rate limiting by user identity rather than token hash (which changes on refresh)."

### Q: "How does the activity merge algorithm work?"

"The merge logic solves a specific problem: the backend has ephemeral storage, so after a Render restart, it loses its FIT file cache. The device has cached activities from previous syncs. When the backend comes back and the user syncs again, I need to combine both sources without duplicates.

The algorithm works in three steps:

1. **Primary dedup by Garmin activity ID.** Each activity has a unique numerical ID from Garmin. I build a map keyed by ID from the cached activities.
   - _Reference:_ [`useActivities.ts:130-133`](mobile/src/hooks/useActivities.ts#L130) — ID-based cache lookup
2. **Secondary dedup by normalized startTime.** Some edge cases produce activities without matching IDs (e.g., a re-download with a different filename). I normalize timestamps by stripping timezone info and seconds, then check for matches within the same minute.
   - _Reference:_ [`useActivities.ts:101-111`](mobile/src/hooks/useActivities.ts#L101) — `normalizeStartTime()` strips timezone and seconds
3. **Property merging.** When I find a match, I prefer the backend's metadata (it's fresher) but keep the device cache's parsed grades and compliance data if the backend doesn't have them yet. This preserves expensive analysis results across backend restarts.
   - _Reference:_ [`useActivities.ts:125-155`](mobile/src/hooks/useActivities.ts#L125) — `mergeActivities()` full merge logic

The key insight is that in a stateless architecture, the mobile device is the primary data store — the backend is a transient compute layer. The merge algorithm reflects that reality."

### Q: "Why Expo Router instead of React Navigation directly?"

"Expo Router is built on top of React Navigation, so I get all its power — stack navigators, tab navigators, modal presentations — with the added benefit of file-based routing.

The advantages for this project:

- **Convention over configuration.** Routes are defined by file structure (`app/(tabs)/activities.tsx` = the activities tab), not imperative navigator setup. This makes the navigation structure immediately readable from the file tree.
- **Deep linking for free.** Every route has a URL automatically. If I add web support or push notifications that link to specific activities, the routing is already there.
- **Type-safe params.** Dynamic routes like `activity/[id]` get typed parameters without manual type declarations.
- **Familiar mental model.** Anyone who's used Next.js understands the routing immediately, which lowers the onboarding cost for new contributors."

### Q: "Describe the offline-first design. How does the app behave when the backend is down?"

"The app is designed to degrade gracefully rather than break when the backend is unavailable — which happens regularly on Render's free tier due to cold starts.

**Connection awareness:** The `useBackendStatus` hook polls `/health` every 5 seconds. The `ConnectionBanner` component shows three states — 'connecting' (pulsing dot, shown after 500ms delay to avoid flash), 'connected' (green, auto-dismisses after 2 seconds), and 'disconnected' (red, persistent). Crucially, this banner is informational — it never blocks the UI.

- _Reference:_ [`useBackendStatus.tsx:33`](mobile/src/hooks/useBackendStatus.tsx#L33) — `POLL_INTERVAL_MS = 5000`
- _Reference:_ [`ConnectionBanner.tsx:44-164`](mobile/src/components/ConnectionBanner.tsx#L44) — animated banner with slide-in/out
- _Reference:_ [`main.py:40-44`](backend/app/main.py#L40) — `/health` endpoint checks FIT directory access

**Cached data access:** Activities are persisted to `AsyncStorage` after every successful sync. When the app launches and the backend is cold, TanStack Query's `queryFn` loads from the device cache first. The user can browse their activity list, view cached details, and use tools (pace calculator, glucose converter) — all without a network connection.

- _Reference:_ [`useActivities.ts:27`](mobile/src/hooks/useActivities.ts#L27) — `ACTIVITIES_STORAGE_KEY = "cached_activities"`
- _Reference:_ [`useActivities.ts:32-39`](mobile/src/hooks/useActivities.ts#L32) — `loadCachedActivities()` from AsyncStorage

**Sync resilience:** When the backend comes back online, the user can trigger a sync. The merge algorithm combines fresh backend data with the device cache, preserving any analysis that was already computed. If the sync fails mid-way (e.g., 429 from Garmin), partially synced activities are still saved.

- _Reference:_ [`useActivities.ts:125-155`](mobile/src/hooks/useActivities.ts#L125) — `mergeActivities()` with dedup and property merging

**What's not offline yet:** Activity detail views require a backend call to parse the FIT file. The SQLite migration (already planned with `expo-sqlite` as a dependency) would store full parsed details on-device, making detail screens work offline too."

### Q: "What about concurrent users? What breaks with two users syncing simultaneously?"

"Several things, and I'll be direct about the limitations:

1. **Shared FIT directory.** All FIT files land in `/data/fit-files/` with no user namespacing. Two users with the same Garmin activity ID would overwrite each other's files. In practice this is unlikely (IDs are user-scoped), but it's architecturally wrong.
   - _Reference:_ [`garmin_sync.py:333-369`](backend/app/services/garmin_sync.py#L333) — `download_activity_fit()` saves to shared path
2. **In-memory cooldowns.** The `_sync_cooldowns` dict is keyed by a SHA256 hash of the Authorization header, so per-user cooldowns work correctly — but only within a single server instance. Multiple Render instances would have independent cooldown state.
   - _Reference:_ [`activities.py:40,260`](backend/app/routers/activities.py#L40) — `_sync_cooldowns` dict with SHA256 key
3. **In-memory MFA state.** `_pending_mfa` stores the Garmin client object in memory. If user A starts login, gets MFA, and the request is routed to a different instance for the MFA submission — it fails.
   - _Reference:_ [`auth.py:23`](backend/app/routers/auth.py#L23) — `_pending_mfa: dict[str, tuple] = {}`
4. **FIT file cache collisions.** The `GET /activities` endpoint lists all FIT files in the shared directory. Without user scoping, User A could see User B's activities in the list.
   - _Reference:_ [`activities.py:148-156`](backend/app/routers/activities.py#L148) — iterates all `.fit` files in shared directory

The fix is straightforward: user-scoped storage paths (`/data/fit-files/{user_id}/`), Redis for session state, and a proper auth system that identifies users beyond just their token hash."

### Q: "What observability would you add for production?"

"The current app has zero observability infrastructure, which is a gap I'd address immediately for production:

1. **Error tracking — Sentry.** Both mobile (React Native SDK) and backend (FastAPI integration). Captures crashes, unhandled exceptions, and performance traces. The Garmin API is particularly flaky — I'd want visibility into which endpoints fail, how often, and with what error codes.
2. **Structured logging — backend.** Replace `print()` statements with Python's `logging` module using JSON format. Log every Garmin API call with duration, status code, and activity count. Ship to a log aggregator (Datadog, CloudWatch).
3. **Mobile analytics — usage patterns.** Which features do users actually use? How often do they check charts vs. coaching? This informs product decisions. Expo has built-in analytics, or Mixpanel/Amplitude for more depth.
4. **Health metrics — Render dashboard.** Response times, error rates, memory usage. The FIT parsing is CPU-intensive — I'd want to know if parsing a marathon-length activity (40K+ data points) causes timeouts.
5. **Alerting.** PagerDuty or Opsgenie for: backend health check failures, Garmin API error rate spikes, and auth flow failure rates above threshold."

### Q: "Our data models in the client mirror DynamoDB. How would you approach decoupling them?"

"This is a model boundary problem. Right now the GraphQL resolvers are probably returning DynamoDB items with minimal transformation — composite partition keys like `USER#123`, overloaded GSI attributes, denormalized shapes leaking through the schema into the client.

GraphQL actually makes this migration elegant. I'd approach it in three layers:

1. **Storage models** (DynamoDB) — stay optimized for access patterns. Don't change these.
2. **Domain models** (GraphQL schema + resolvers) — this is the key layer. The schema defines clean types like `TrainingPlan`, `Workout`, `Exercise` that represent business concepts. Resolvers handle the translation from DynamoDB's `PK: USER#123, SK: PLAN#2026-03-23` into those typed domain objects. This is where the decoupling happens.
3. **View models** (RN client) — codegen'd TypeScript types from the schema, plus local computed fields, formatting, and UI state.

The beauty of GraphQL here is that codegen keeps client types in sync with the schema automatically — no manual type maintenance. And I can migrate incrementally: add new properly-shaped types to the schema alongside the old ones, mark old fields `@deprecated`, migrate screen by screen, then remove deprecated types.

In Atlas I have this same pattern with REST. Raw FIT binary files are my storage layer. Pydantic models in Python are my domain layer — `ActivityDetails`, `GradeSummary`. TypeScript interfaces are my client layer. With GraphQL, the schema would replace both Pydantic and TypeScript as a single source of truth, with codegen generating the client types."

### Q: "Why are you interested in this role / what draws you to Runna?"

"Three things align well. First, I'm a runner — I built Atlas because I wanted deeper insight into my own running dynamics than Garmin Connect provides. Runna's mission of making structured training accessible resonates personally.

Second, the technical challenges are exactly what I find interesting. The information re-architecture — decoupling DynamoDB models from client models — is a classic staff-level problem. It requires thinking across the full stack: data modeling, API contract design, and incremental migration strategy. That's the kind of work I want to do.

Third, the strength training expansion is a greenfield opportunity to build the data layer right from the start, applying the lessons from the re-arch to a new feature domain."

### Q: "How would you approach building the strength training feature?"

"This is a greenfield opportunity to apply the re-architecture principles correctly from the start.

For the data model, strength workouts have different structure than running — exercises with sets, reps, weight, rest periods, and video demonstrations rather than continuous GPS/pace data. I'd design the DynamoDB schema around the access patterns (fetch today's workout, fetch exercise library, track progression over time) but crucially define clean API models that the client consumes.

The client-side view models would be shaped for the strength UI — exercise cards with video thumbnails, set tracking with rest timers, progression charts. These shouldn't know anything about partition keys or GSI overloading.

For integration with the running plan, I'd ensure the API returns a unified weekly schedule that includes both run and strength sessions, but the detail payloads are type-discriminated — the client knows whether to render a run view or a strength view.

Key considerations: offline support for gym sessions (no reliable WiFi), video caching strategy for exercise demos, and Apple Watch / Garmin integration for strength tracking (heart rate, duration)."

### Q: "You built a Garmin integration. What were the hardest parts?"

"Three things. First, the OAuth flow — Garmin uses OAuth 1.0a for initial auth, then OAuth 2.0 for API access, plus MFA. The `garminconnect` library abstracts some of this, but handling the MFA state machine across a stateless backend required careful design. I store the pending session in memory keyed by email, which works for single-instance but would need Redis or DynamoDB with TTL at scale.

Second, rate limiting from cloud IPs. This was invisible in local development — Garmin throttles AWS/cloud provider IPs much more aggressively than residential. I discovered this from Render production logs: login succeeded but MFA consistently hit 429s. The fix was multi-layer: exponential backoff on OAuth endpoints, 60-second backend sync cooldown, 0.5-second throttle between FIT file downloads, and client-side retry with Retry-After header support.

Third, data quality in FIT files. Raw sensor data includes artifacts from stops, pauses, and recovery intervals. I built threshold-based artifact detection (cadence below 120, GCT above 300) and workout-aware recovery classification so interval rest periods aren't flagged as errors. Without this, all the grading and fatigue analysis would be meaningless."

---

## 8. Code Walkthrough Reference

Critical code paths you should be able to explain line-by-line during a live interview. Organized by feature area.

### Authentication & Token Management

| What                                     | File                                                         | Lines                 | Key Detail                                                                                         |
| :--------------------------------------- | :----------------------------------------------------------- | :-------------------- | :------------------------------------------------------------------------------------------------- |
| Token decoding from Authorization header | [`auth.py`](backend/app/dependencies/auth.py#L20)            | 20-60                 | Bearer prefix validation → base64 decode → tar.gz extraction to temp dir → token file verification  |
| In-memory MFA session storage            | [`auth.py`](backend/app/routers/auth.py#L23)                 | 23                    | `_pending_mfa: dict[str, tuple]` stores (Garmin client, client_state) per email                    |
| MFA session store and cleanup            | [`auth.py`](backend/app/routers/auth.py#L79)                 | 79, 89, 127, 136, 146 | Session stored on login, retrieved on MFA submit, cleaned up after use                             |
| Secure token storage (device)            | [`authService.ts`](mobile/src/services/authService.ts#L52)   | 52-81                 | `getAuthHeader()` retrieves from expo-secure-store, `storeTokens()` persists                       |
| Token refresh interceptor                | [`authService.ts`](mobile/src/services/authService.ts#L93)   | 93-100                | Checks `X-Refreshed-Tokens` header on every response, silently updates stored tokens               |
| Auth state provider                      | [`AuthContext.tsx`](mobile/src/contexts/AuthContext.tsx#L29) | 29-103                | `checkAuth()` on mount, login with MFA detection, logout clears secure store                       |

### Data Fetching & Caching

| What                     | File                                                        | Lines  | Key Detail                                                                                                                |
| :----------------------- | :---------------------------------------------------------- | :----- | :------------------------------------------------------------------------------------------------------------------------ |
| Centralized API caller   | [`api.ts`](mobile/src/services/api.ts#L74)                  | 74-117 | `fetchJson` wraps all requests with auth headers, retry logic, and token refresh                                          |
| Client-side 429 retry    | [`api.ts`](mobile/src/services/api.ts#L40)                  | 40-58  | `retryOn429()` — `Math.pow(2, attempt) * 1000 + Math.random() * 500` backoff, respects `Retry-After`                      |
| QueryClient config       | [`_layout.tsx`](mobile/app/_layout.tsx#L18)                 | 18-22  | `staleTime: 5 * 60 * 1000`, `retry: 2` — controls cache freshness and automatic retries                                   |
| AsyncStorage persistence | [`useActivities.ts`](mobile/src/hooks/useActivities.ts#L27) | 27-49  | `ACTIVITIES_STORAGE_KEY`, `loadCachedActivities()`, `saveCachedActivities()` — device-first cache                         |
| Activity merge/dedup     | [`useActivities.ts`](mobile/src/hooks/useActivities.ts#L101) | 101-155 | `normalizeStartTime()` for secondary key, ID + time dedup, property merging (prefer backend metadata, keep cached grades) |

### Rate Limiting & Resilience

| What                  | File                                                                     | Lines          | Key Detail                                                                                   |
| :-------------------- | :----------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------- |
| Backend sync cooldown | [`activities.py`](backend/app/routers/activities.py#L40)                 | 40, 260-269    | `_sync_cooldowns` dict, 60s per-user cooldown, SHA256 of auth header as key                  |
| Backend retry utility | [`retry.py`](backend/app/utils/retry.py#L4)                              | 4-15           | `retry_garmin_call()` — `(2 ** attempt) * 2` second delays, checks for "429" in error string |
| OAuth SSO retry       | [`auth.py`](backend/app/routers/auth.py#L70)                             | 70, 140        | `retry_garmin_call()` wraps `login()` and `resume_login()` for cloud IP rate limiting        |
| FIT download throttle | [`garmin_sync.py`](backend/app/services/garmin_sync.py#L585)             | 585-604        | `sync_latest()` — `time.sleep(0.5)` between downloads, cache check before download           |
| Health polling        | [`useBackendStatus.tsx`](mobile/src/hooks/useBackendStatus.tsx#L33)      | 33-106         | 5s poll interval, 10s timeout, abort controller, concurrent check prevention                 |
| Connection banner     | [`ConnectionBanner.tsx`](mobile/src/components/ConnectionBanner.tsx#L44) | 44-166         | Slide animation, 500ms delay before showing, auto-dismiss on connected (2s)                  |

### FIT Parsing & Analysis

| What                    | File                                                       | Lines        | Key Detail                                                                                     |
| :---------------------- | :--------------------------------------------------------- | :----------- | :--------------------------------------------------------------------------------------------- |
| FIT file parsing entry  | [`fit_parser.py`](backend/app/services/fit_parser.py#L68)  | 68-115, 207  | `FitFile(str(fit_path))`, iterates `record` messages for 1-second data points                  |
| Field mapping           | [`fit_parser.py`](backend/app/services/fit_parser.py#L207) | 207-252      | Maps raw FIT fields (cadence, heart_rate, developer fields) to my schema                      |
| Grade calculation       | [`fit_parser.py`](backend/app/services/fit_parser.py#L17)  | 17-21, 36-65 | `GRADES` dict with thresholds, `grade_metric()` handles higher/lower-is-better                 |
| Fatigue comparison      | [`fit_parser.py`](backend/app/services/fit_parser.py#L408) | 408-449      | `compute_fatigue_comparison()` — splits at midpoint, direction-aware comparison                |
| Best efforts            | [`fit_parser.py`](backend/app/services/fit_parser.py#L372) | 372-405      | Distance interpolation, wall-clock to moving-time scaling: `scale = timer_time / elapsed_time` |
| Race distance constants | [`fit_parser.py`](backend/app/services/fit_parser.py#L24)  | 24-33        | `RACE_DISTANCES` — 1km, 1mi, 5K, 10K, 15K, half marathon, 30K, marathon                        |
| Distance interpolation  | [`fit_parser.py`](backend/app/services/fit_parser.py#L347) | 347-369      | `_interpolate_elapsed_at_distance()` for sub-record precision                                  |
| Glucose extraction      | [`fit_parser.py`](backend/app/services/fit_parser.py#L248) | 248          | `elif name == "glucose_level": data["glucoseLevel"] = value`                                   |

### Workout Compliance

| What                        | File                                                                      | Lines | Key Detail                                                                              |
| :-------------------------- | :------------------------------------------------------------------------ | :---- | :-------------------------------------------------------------------------------------- |
| Per-step compliance scoring | [`workout_compliance.py`](backend/app/services/workout_compliance.py#L40) | 40-68 | `calculate_step_compliance()` with hit/fast/partial/missed status                       |
| Pace range logic            | [`workout_compliance.py`](backend/app/services/workout_compliance.py#L73) | 73-97 | 5% tolerance band (line 92), handles steps without pace targets via distance compliance |
| Workout matching fallbacks  | [`garmin_sync.py`](backend/app/services/garmin_sync.py#L531)              | 531+  | Associated workout → calendar lookup → name/distance matching                           |

### Charts & Visualization

| What                            | File                                                                                  | Lines  | Key Detail                                              |
| :------------------------------ | :------------------------------------------------------------------------------------ | :----- | :------------------------------------------------------ |
| Skia chart with touch scrubbing | [`InteractiveRunChart.tsx`](mobile/src/components/charts/InteractiveRunChart.tsx#L100) | 100-224 | PanResponder for tooltips, GPU path rendering           |
| Artifact filtering              | [`InteractiveRunChart.tsx`](mobile/src/components/charts/InteractiveRunChart.tsx#L61) | 61-67  | `filterArtifacts()` removes stop points from chart data |
| Data smoothing                  | [`InteractiveRunChart.tsx`](mobile/src/components/charts/InteractiveRunChart.tsx#L104) | 104  | `smoothData()` — 15-point rolling average called inline |

### Garmin Sync Orchestration

| What                      | File                                                         | Lines   | Key Detail                                                                             |
| :------------------------ | :----------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------- |
| Main sync flow            | [`garmin_sync.py`](backend/app/services/garmin_sync.py#L585) | 585-604 | Get recent activities → filter running → download FIT → parse → return summaries       |
| FIT file download         | [`garmin_sync.py`](backend/app/services/garmin_sync.py#L333) | 333-369 | `download_activity_fit()` — downloads and saves .fit from Garmin                       |
| Token refresh detection   | [`garmin_sync.py`](backend/app/services/garmin_sync.py#L145) | 145-164 | `get_refreshed_tokens()` compares initial vs current access token                      |
| X-Refreshed-Tokens header | [`activities.py`](backend/app/routers/activities.py#L277)    | 277,498 | Sets refreshed tokens header on sync and detail responses                              |
| Activity dedup on backend | [`activities.py`](backend/app/routers/activities.py#L116)    | 116-156 | `extract_garmin_id()` from filename, dict keyed by ID preferring descriptive filenames |

---

## 9. Quick Stats for Conversation

- **Lines of code:** ~5,000+ (mobile) + ~1,500 (backend)
- **Development time:** ~3 weeks
- **Key metrics parsed:** Cadence, GCT, GCT Balance, Vertical Ratio, HR, Glucose
- **API endpoints:** 6 (health, login, mfa, activities list, sync, detail)
- **Deployment:** Docker container on Render (free tier)
