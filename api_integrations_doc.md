# API Integrations Documentation

This file documents the API (Firestore) integrations for each screen, including request and response patterns.

---

## Batch 1
Status: Implementation Integrated

### 1. Dashboard (`/src/pages/Dashboard.tsx`)
- **Status**: **DONE** (Real-time fetching with demo fallback)
- **Operations**:
  - `LIST sessions`: Fetch active or completed sessions where `memberIds` contains `user.id`.
    - *Request*: `query(collection(db, 'sessions'), where('memberIds', 'array-contains', user.id), where('status', 'in', ['LOBBY', 'ACTIVE']), limit(1))`
    - *Response*: `Session` object.
  - `LIST mistakes`: Fetch unresolved mistakes for the user.
    - *Request*: `query(collection(db, 'mistakes'), where('userId', '==', user.id), where('resolved', '==', false), limit(3))`
    - *Response*: Array of `Mistake` objects.

### 2. Login (`/src/pages/Auth/LoginPage.tsx`)
- **Status**: **DONE** (Firebase Auth Popup/OTP)
- **Operations**:
  - Handled via `AuthContext`.
  - `requestOtp`: Sends OTP via authentication service.

### 3. OTP Verify (`/src/pages/Auth/OtpVerifyPage.tsx`)
- **Status**: **DONE** (Firebase Auth)
- **Operations**:
  - Handled via `AuthContext`.
  - `verifyOtp`: Verifies the 6-digit code.

### 4. Register (`/src/pages/Auth/RegisterPage.tsx`)
- **Status**: **DONE** (Auth + Firestore User Sync)
- **Operations**:
  - Handled via `AuthContext`.
  - `register`: Creates a new user document in `users` collection.

### 5. Create Session (`/src/pages/Session/CreateSession.tsx`)
- **Status**: **DONE** (Script binding + Session Initialization)
- **Operations**:
  - `GET scripts`: Fetch script details by ID.
    - *Request*: `getDoc(doc(db, 'scripts', scriptId))`
  - `CREATE sessions`: Initialize a practice session.
    - *Request*: `addDoc(collection(db, 'sessions'), sessionData)`

### 6. Join Session (`/src/pages/Session/JoinSession.tsx`)
- **Status**: **DONE** (Code Lookup)
- **Operations**:
  - `LIST sessions`: Locate session by join code.
    - *Request*: `query(collection(db, 'sessions'), where('joinCode', '==', code), limit(1))`

### 7. Lobby (`/src/pages/Session/Lobby.tsx`)
- **Status**: **DONE** (Real-time Syncing)
- **Operations**:
  - `GET sessions` (Listen): Real-time session status.
  - `LIST sessions/{id}/members` (Listen): Real-time member list updates.

### 8. Repractice Round (`/src/pages/Game/RepracticeRound.tsx`)
- **Status**: **DONE** (Integrated with Mistake DB)
- **Operations**:
  - `LIST mistakes`: Fetch unresolved mistakes for practice.
    - *Request*: `query(collection(db, 'mistakes'), where('userId', '==', user.id), where('resolved', '==', false), limit(10))`
  - `UPDATE mistakes/{id}`: Update mistake with resolution status.

### 9. Session Room (`/src/pages/Game/SessionRoom.tsx`)
- **Status**: **DONE** (Real-time Multi-step Session)
- **Operations**:
  - `GET sessions` (Listen): Real-time room status.
  - `UPDATE sessions/{id}`: Advance `turnIndex` or change `status`.

### 10. Improvement Tracker (`/src/pages/User/ImprovementTracker.tsx`)
- **Status**: **SIMULATED** (Uses semi-static logic)
- **Operations**:
  - `LIST sessions`: Fetch history for charting.
    - *Request*: `query(collection(db, 'sessions'), orderBy('createdDate', 'desc'), limit(10))`

---

## Batch 2
Status: Implementation Integrated & Mocked

### 11. My Mistakes (`/src/pages/User/MyMistakes.tsx`)
- **Status**: **DONE** (Real-time Sorting)
- **Operations**:
  - `LIST mistakes`: Fetch all user mistakes with timestamp sorting.

### 12. Profile (`/src/pages/User/Profile.tsx`)
- **Status**: **DONE** (User Profile Sync)
- **Operations**:
  - `UPDATE users/{id}`: Update user profile details.

### 13. Progress Dashboard (`/src/pages/User/ProgressDashboard.tsx`)
- **Status**: **PARTIAL** (Aggregates live data but has fallback)
- **Operations**:
  - `LIST sessions`: Fetch last 20 sessions for overview stats.

### 14. Session Detail (`/src/pages/User/SessionDetail.tsx`)
- **Status**: **DONE** (Deep Linking)
- **Operations**:
  - `GET sessions`: Fetch specific session analysis.

### 15. Session List (`/src/pages/User/SessionList.tsx`)
- **Status**: **DONE** (History List)
- **Operations**:
  - `LIST sessions`: Fetch up to 50 recent sessions.

### 16. User Settings (`/src/pages/User/UserSettings.tsx`)
- **Status**: **DONE** (Prefs Sync)
- **Operations**:
  - `UPDATE users/{id}`: Save preferences.

### 17. Script Library (`/src/pages/Scripts/ScriptLibrary.tsx`)
- **Status**: **DONE** (Global Script DB)
- **Operations**:
  - `LIST scripts`: Fetch available scripts.

### 18. Admin Dashboard (`/src/pages/Admin/AdminDashboard.tsx`)
- **Status**: **DONE** (Global stats overview)
- **Operations**:
  - `LIST users`, `LIST sessions`, `LIST mistakes`: Global aggregation.

### 19. Reports Overview (`/src/pages/Admin/ReportsOverview.tsx`)
- **Status**: **MOCK** (Uses Dummy User Data)
- **Operations**:
  - *Internal*: Iterates `DUMMY_USERS`.

### 20. Script Management (`/src/pages/Admin/ScriptManagement.tsx`)
- **Status**: **MOCK** (Uses Dummy Script Data)
- **Operations**:
  - *Internal*: Iterates `DUMMY_SCRIPTS`.

---

## Batch 3
Status: Planned or Partially Integrated

### 21. Script Upload (`/src/pages/Admin/ScriptUpload.tsx`)
- **Status**: **MOCK** (Simulated Wizard)
- **Operations**:
  - `CREATE scripts`: (Planned) Saving parsed data.

### 22. User Detail Report (`/src/pages/Admin/UserDetailReport.tsx`)
- **Status**: **MOCK** (Uses Dummy User/Session Data)
- **Operations**:
  - *Internal*: Lookups in `DUMMY_USERS`.

### 23. User Management (`/src/pages/Admin/UserManagement.tsx`)
- **Status**: **MOCK** (Uses Dummy List)
- **Operations**:
  - *Internal*: Iterates `DUMMY_USERS`.

### 24. Session Report (`/src/pages/Assessment/SessionReport.tsx`)
- **Status**: **DONE** (Evaluation Summary)
- **Operations**:
  - `GET sessions`: Retrieve master session record.
  - `LIST assessments`: Aggregate evaluations.

---

## Error Handling Standards
To resolve "Missing or insufficient permissions" errors, all screens must implement the `handleFirestoreError` utility as per Firebase Integration Guidelines. This provides the necessary trace ID and context (UID, path, operation) to debug Security Rules.
