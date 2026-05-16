# Go With Flow — API Integrations Documentation

## Overview
- **Frontend:** Angular 17 (Standalone Components)
- **Backend:** .NET 8 REST API
- **Base URL:** `http://localhost:8080/api/v1`
- **Real-time:** SignalR
- **Auth:** JWT Bearer tokens
- **isDemo Strategy:** When `environment.isDemo = true`, services use dummy data and skip HTTP/SignalR calls.

---

## API Response Wrapper
All endpoints return the following structure:
```json
{
  "success": boolean,
  "message": "string",
  "data": T,
  "errors": ["string"] | null
}
```

---

## Screen Integrations

### Auth
| Screen | Path | Component | Status | Service | Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Login | `/auth/login` | `LoginComponent` | DONE | `AuthService` | `POST /api/v1/auth/verify-otp` |
| OTP Verify | `/auth/otp-verify` | `OtpVerifyComponent` | DONE | `AuthService` | `POST /api/v1/auth/verify-otp` |
| Register | `/auth/register` | `RegisterComponent` | DONE | `AuthService` | `POST /api/v1/auth/register` |

### Admin
| Screen | Path | Component | Status | Service | Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Admin Dashboard | `/admin/dashboard` | `AdminDashboardComponent` | DONE | `AdminService` | `GET /api/v1/admin/dashboard` |
| User Management | `/admin/users` | `AdminUsersComponent` | DONE | `AdminService` | `GET /api/v1/admin/users` |
| Script Management | `/admin/scripts` | `AdminScriptsComponent` | DONE | `AdminService` | `GET /api/v1/admin/scripts` |
| Reports Overview | `/admin/reports` | `AdminReportsComponent` | DONE | `AdminService` | `GET /api/v1/admin/reports` |
| User Full Report | `/admin/reports/user/:id` | `UserDetailReportComponent` | DONE | `AdminService` | `GET /api/v1/admin/reports/users/{userId}` |

### Session & Live Session
| Screen | Path | Component | Status | Service | Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Create Session | `/session/create` | `CreateSessionComponent` | PARTIAL | `SessionService` | `POST /api/v1/sessions` |
| Join Session | `/session/join` | `JoinSessionComponent` | PARTIAL | `SessionService` | `POST /api/v1/sessions/join` |
| Lobby | `/session/lobby/:id` | `LobbyComponent` | PARTIAL | `SessionService` | `GET /api/v1/sessions/lobby/{sessionId}` |
| Session List | `/session/history` | `SessionListComponent` | PARTIAL | `SessionService` | `GET /api/v1/sessions/history` |
| Speaker Screen | `/live-session/room/:id` | `SpeakerScreenComponent` | PARTIAL | `LiveSessionService` | `POST /api/v1/turns/{sessionId}/voice-analysis` |
| Listener Screen | `/live-session/room/:id` | `ListenerScreenComponent` | PARTIAL | `LiveSessionService` | `POST /api/v1/turns/{sessionId}/listener-feedback` |
| Session Report | `/session/report/:id` | `SessionReportComponent` | DONE | `LiveSessionService` | `GET /api/v1/sessions/{sessionId}/complete` |

### User & Practice
| Screen | Path | Component | Status | Service | Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| My Mistakes | `/user/my-mistakes` | `MyMistakesComponent` | DONE | `MistakeService` | `GET /api/v1/mistakes` |
| Correction Round| `/repractice/:id` | `CorrectionRoundComponent` | MOCK | `RepracticeService` | `POST /api/v1/repractice/generate` |
| User Dashboard | `/user/dashboard` | `UserDashboardComponent` | DONE | `UserService` | `GET /api/v1/dashboard` |
| User Profile | `/user/profile` | `UserProfileComponent` | DONE | `UserService` | `GET /api/v1/users/profile` |

---

## SignalR Real-time Events

### Hub: `/hubs/session` (Lobby)
- **MEMBER_JOINED**: `userId, name, slotIndex`
- **MEMBER_READY**: `userId`
- **SESSION_STARTED**: `sessionId, firstSpeakerId`

### Hub: `/hubs/live-session` (Room)
- **TURN_SHIFT**: `newActiveMemberId, slotIndex, turnIndex, nextUtterance`
- **LISTENER_TAG**: `tag, fromUserId`
- **SESSION_ENDED**: `sessionId, summary`

---

## Error Handling Standards
Handled globally via `AuthInterceptor` and `ToastService`:
- **401**: Unauthorized. Triggers token refresh or logout.
- **403**: Forbidden. Toast: "Not authorized to perform this action".
- **409**: Conflict. Toast: "This record already exists".
- **422**: Validation Error. Toast: Shows business rule violations.
- **500**: Server Error. Toast: "Server error. Please try again later."
- **0**: Connection Error. Toast: "Cannot connect to server."

---

## isDemo Configuration
Enabled in `src/environments/environment.ts`.
- **Auth**: Skips real OTP, supports instant login for demo roles.
- **Real-time**: `WebsocketService` uses `setInterval` to mock `TURN_SHIFT` and `MEMBER_JOINED` events.
- **CRUD**: Services return delayed `of()` observables with dummy data from `src/app/data/dummy`.
