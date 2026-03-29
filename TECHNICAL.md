# Attendly — Technical Reference

- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Device Sign-in Protection](#device-sign-in-protection)
- [Development Progress](#development-progress)

---

## Database Schema

```
User
  id, role (LECTURER | STUDENT), fullName, email, passwordHash
  department?, matricNumber?, gender (MALE | FEMALE)?, level?
  createdAt, updatedAt

Course
  id, lecturerId, courseCode, courseTitle, isArchived
  createdAt, updatedAt
  UNIQUE (lecturerId, courseCode)

CourseEnrollment
  id, courseId, matricNumber, studentName?
  createdAt
  UNIQUE (courseId, matricNumber)
  — when any rows exist for a course, only enrolled matric numbers can sign attendance

Session
  id, courseId, lecturerId
  latitude, longitude, geofenceRadiusM (default 50m)
  timeLimitMinutes, level? (optional — restricts sign-in by student level)
  qrPayload (UNIQUE), status (ACTIVE | CLOSED)
  createdAt, expiresAt, closedAt?

Attendance
  id, sessionId, studentId
  deviceId?       — persistent browser UUID (one sign-in per device per session)
  fingerprint?    — browser fingerprint hash (blocks incognito/localStorage bypass)
  ipAddress?      — client IP (blocks duplicate sign-ins from same connection)
  markedManually  — true when added by lecturer via manual mark (default false)
  latitude, longitude, distanceM
  signedAt
  UNIQUE (sessionId, studentId)
  UNIQUE (sessionId, deviceId)
  UNIQUE (sessionId, fingerprint)
  UNIQUE (sessionId, ipAddress)

PasswordResetToken
  id, userId, token (UNIQUE), expiresAt, usedAt?
  createdAt
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <accessToken>`.
Rate-limited auth endpoints: 5 requests/minute per IP.

> 🔒 = requires valid access token · **LECTURER** / **STUDENT** = role restriction

---

### Auth — `/api/auth`

#### `POST /api/auth/register`
Create a new lecturer or student account.

> Students must use a `@student.funaab.edu.ng` email address.

**Body**
```json
{
  "role": "STUDENT",
  "fullName": "Chukwuemeka Obi",
  "email": "c.obi@student.funaab.edu.ng",
  "password": "mypassword",
  "matricNumber": "2021/1234",
  "department": "Computer Science",
  "gender": "MALE",
  "level": 300
}
```
> `matricNumber`, `department`, `gender`, `level` are required for `STUDENT` role only.

**Response `201`**
```json
{
  "user": { "id": "...", "role": "STUDENT", "fullName": "...", "email": "...", "level": 300 },
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

#### `POST /api/auth/login`
Login with email or matric number.

**Body**
```json
{ "identifier": "c.obi@student.funaab.edu.ng", "password": "mypassword" }
```
> `identifier` accepts email address or matric number.

**Response `200`**
```json
{ "user": { ... }, "accessToken": "...", "refreshToken": "..." }
```

---

#### `POST /api/auth/refresh`
Exchange a refresh token for a new access token.

**Body**
```json
{ "refreshToken": "..." }
```

**Response `200`**
```json
{ "accessToken": "..." }
```

---

#### `POST /api/auth/forgot-password`
Request a password reset link. Always returns success to prevent email enumeration.

**Body**
```json
{ "email": "c.obi@student.funaab.edu.ng" }
```

**Response `200`**
```json
{ "message": "If an account exists, a reset link has been sent." }
```

---

#### `POST /api/auth/reset-password`
Reset password using a token from the reset email.

**Body**
```json
{ "token": "...", "newPassword": "newpassword123" }
```

**Response `200`**
```json
{ "message": "Password reset successfully." }
```

---

#### `GET /api/auth/me` 🔒
Get the current authenticated user's profile.

**Response `200`**
```json
{ "user": { "id": "...", "role": "...", "fullName": "...", "email": "...", "level": 300 } }
```

---

#### `PUT /api/auth/profile` 🔒
Update the current user's profile fields.

**Body** *(all fields optional)*
```json
{
  "fullName": "Chukwuemeka Obi Jr.",
  "department": "Software Engineering",
  "gender": "MALE",
  "level": 400
}
```

**Response `200`**
```json
{ "user": { ... } }
```

---

#### `POST /api/auth/change-password` 🔒
Change password. Verifies the current password before updating.

**Body**
```json
{ "currentPassword": "oldpassword", "newPassword": "newpassword123" }
```

**Response `200`**
```json
{ "message": "Password updated successfully." }
```

---

### Courses — `/api/courses`

All course endpoints require **LECTURER** role.

#### `POST /api/courses` 🔒
Create a new course.

**Body**
```json
{ "courseCode": "CSC301", "courseTitle": "Data Structures and Algorithms" }
```

**Response `201`**
```json
{ "course": { "id": "...", "courseCode": "CSC301", "courseTitle": "...", "isArchived": false } }
```

---

#### `GET /api/courses` 🔒
List all courses belonging to the authenticated lecturer, including session count.

**Response `200`**
```json
{
  "courses": [
    { "id": "...", "courseCode": "CSC301", "courseTitle": "...", "isArchived": false, "_count": { "sessions": 5 } }
  ]
}
```

---

#### `GET /api/courses/:id` 🔒
Get a single course with its full sessions list.

**Response `200`**
```json
{
  "course": { "id": "...", "courseCode": "CSC301", ... },
  "sessions": [
    { "id": "...", "createdAt": "...", "status": "CLOSED", "_count": { "attendances": 23 } }
  ]
}
```

---

#### `PUT /api/courses/:id` 🔒
Update course code or title.

**Body** *(all fields optional)*
```json
{ "courseCode": "CSC302", "courseTitle": "Advanced Data Structures" }
```

**Response `200`**
```json
{ "course": { ... } }
```

---

#### `PATCH /api/courses/:id/archive` 🔒
Toggle the archived status of a course.

**Response `200`**
```json
{ "course": { "id": "...", "isArchived": true } }
```

---

#### `GET /api/courses/:id/enrollment` 🔒
Get the enrollment list for a course.

**Response `200`**
```json
{
  "enrollments": [
    { "id": "...", "matricNumber": "2021/1234", "studentName": "John Doe" }
  ],
  "total": 42
}
```

---

#### `POST /api/courses/:id/enrollment` 🔒
Import (upsert) a list of enrolled students. Existing entries are updated, not duplicated.

**Body**
```json
{
  "students": [
    { "matricNumber": "2021/1234", "studentName": "John Doe" },
    { "matricNumber": "2021/5678" }
  ]
}
```

**Response `200`**
```json
{ "imported": 2, "total": 42 }
```

> Once any enrollment entries exist for a course, only students whose matric number is in the list can sign attendance. Students without a matric number on their account are also blocked.

---

#### `DELETE /api/courses/:id/enrollment` 🔒
Remove all enrolled students from the course, lifting the sign-in restriction.

**Response `200`**
```json
{ "deleted": 42 }
```

---

### Sessions — `/api/sessions`

#### `POST /api/sessions` 🔒 LECTURER
Create a new attendance session. Generates a QR code and schedules auto-close.

**Body**
```json
{
  "courseId": "uuid",
  "timeLimitMinutes": 30,
  "latitude": 8.9833,
  "longitude": 7.3833,
  "geofenceRadiusM": 50,
  "level": 300
}
```
> `geofenceRadiusM` defaults to `50`. `level` is optional — omit to allow all levels.

**Response `201`**
```json
{
  "session": { "id": "...", "status": "ACTIVE", "expiresAt": "...", "level": 300 },
  "qrCodeImage": "data:image/png;base64,...",
  "attendUrl": "https://attendly.vercel.app/attend/session-id"
}
```

---

#### `GET /api/sessions/:id` 🔒 LECTURER
Get full session detail including attendee list and QR code image.

**Response `200`**
```json
{
  "session": { "id": "...", "status": "ACTIVE", "level": 300, "course": { ... } },
  "qrCodeImage": "data:image/png;base64,...",
  "attendUrl": "https://attendly.vercel.app/attend/session-id",
  "attendees": [
    {
      "id": "...", "fullName": "Chukwuemeka Obi", "matricNumber": "2021/1234",
      "department": "Computer Science", "signedAt": "2025-03-25T10:15:00Z", "distanceM": "12.50"
    }
  ]
}
```

---

#### `PATCH /api/sessions/:id/close` 🔒 LECTURER
Manually close an active session before its timer expires.

**Response `200`**
```json
{ "id": "...", "status": "CLOSED", "closedAt": "..." }
```

---

#### `GET /api/sessions/:id/stream` 🔒 LECTURER
Server-Sent Events stream. Emits a new event each time a student signs in during an active session.

> SSE does not support custom headers. Pass the access token as a query parameter:
> `GET /api/sessions/:id/stream?token=<accessToken>`

**Event format**
```
data: {"id":"...","fullName":"...","matricNumber":"...","department":"...","signedAt":"...","distanceM":"12.50","markedManually":false}
```
> `markedManually` is `true` when the entry was added by the lecturer via the manual mark feature.

---

#### `GET /api/sessions/:id/info`
Get public session info for the student attend flow (no attendee list, no QR image). Does not require authentication.

**Response `200`**
```json
{
  "courseTitle": "Data Structures and Algorithms",
  "courseCode": "CSC301",
  "lecturerName": "Dr. Adebayo",
  "status": "ACTIVE",
  "expiresAt": "2025-03-25T11:00:00Z",
  "geofenceRadiusM": 50,
  "level": 300
}
```

---

### Attendance — `/api/attendance`

#### `POST /api/attendance` 🔒 STUDENT
Sign attendance for a session. Verifies GPS proximity, level restriction, enrollment, and device uniqueness.

**Body**
```json
{
  "sessionId": "uuid",
  "latitude": 8.9841,
  "longitude": 7.3840,
  "deviceId": "persistent-browser-uuid",
  "fingerprint": "a3f9c12b"
}
```
> `deviceId` and `fingerprint` are optional but strongly recommended. They prevent multiple students from signing in from the same physical device.

**Response `201`**
```json
{ "attendance": { "id": "...", "distanceM": "12.50", "signedAt": "..." }, "message": "Attendance signed successfully" }
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Session is closed or expired |
| `400` | Student is outside the geofence radius |
| `403` | Student's level does not match the session's level restriction |
| `403` | Student's matric number is not on the course enrollment list |
| `409` | Student has already signed for this session |
| `409` | This device has already been used to sign attendance for this session |
| `409` | This IP address has already been used to sign attendance for this session |

---

#### `POST /api/attendance/sessions/:sessionId/manual` 🔒 LECTURER
Manually mark a registered student as present for an active session.

**Body**
```json
{ "studentId": "uuid" }
```

**Response `201`**
```json
{ "attendance": { "id": "...", "markedManually": true, "signedAt": "..." }, "message": "Student marked present successfully" }
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Session is closed or expired |
| `404` | Session not found or does not belong to this lecturer |
| `404` | Student not found |
| `409` | Student has already been marked present for this session |

---

#### `GET /api/attendance/history` 🔒 STUDENT
Get the authenticated student's full attendance history.

**Query params** *(optional)*
- `courseId` — filter by a specific course

**Response `200`**
```json
{
  "history": [
    {
      "id": "...", "signedAt": "...",
      "session": {
        "id": "...", "createdAt": "...",
        "course": { "courseCode": "CSC301", "courseTitle": "..." }
      }
    }
  ]
}
```

---

#### `GET /api/attendance/course/:courseId` 🔒 LECTURER
Aggregate attendance records for a course — per-student stats across all sessions.

**Response `200`**
```json
{
  "course": { "id": "...", "courseCode": "CSC301" },
  "sessions": [
    { "id": "...", "createdAt": "...", "status": "CLOSED", "attendeeCount": 23 }
  ],
  "records": [
    {
      "id": "...", "fullName": "Chukwuemeka Obi", "matricNumber": "2021/1234",
      "department": "Computer Science", "gender": "MALE",
      "attended": 4, "total": 5, "percentage": 80
    }
  ],
  "stats": { "totalSessions": 5, "totalStudents": 38 }
}
```

---

#### `GET /api/attendance/course/:courseId/export` 🔒 LECTURER
Download a CSV of attendance records for the course.

**Response `200`** — `Content-Type: text/csv`
```
Name,Matric Number,Department,Gender,Sessions Attended,Total Sessions,Percentage
"Chukwuemeka Obi","2021/1234","Computer Science","MALE",4,5,80%
```

---

### Users — `/api/users`

#### `GET /api/users/search` 🔒 LECTURER
Search registered students by name or matric number. Used by the manual mark feature.

**Query params**
- `q` — search query (minimum 2 characters)

**Response `200`**
```json
{
  "students": [
    { "id": "...", "fullName": "Chukwuemeka Obi", "matricNumber": "2021/1234", "department": "Computer Science", "level": 300 }
  ]
}
```

> Returns up to 10 matches, ordered alphabetically. Returns an empty array if `q` is shorter than 2 characters.

---

## Device Sign-in Protection

Each attendance record captures three signals to prevent a single device or connection being used by multiple students in the same session:

| Signal | How it works | Survives |
|---|---|---|
| **Device UUID** (`deviceId`) | UUID generated on first visit, stored in `localStorage` | Normal browser sessions |
| **Browser fingerprint** (`fingerprint`) | FNV-1a hash of user agent, screen, timezone, hardware concurrency, platform | Incognito mode, cleared localStorage |
| **IP address** | Server-captured client IP | All client-side bypasses |

All three are enforced as unique constraints on the `Attendance` table per session. `deviceId` and `fingerprint` are optional on the API — if omitted, only the per-student and IP uniqueness constraints apply.

---

## Development Progress

| Sprint | Scope | Status |
|---|---|---|
| **Sprint 1** | Scaffolding, DB schema, design system, landing page, auth pages, dashboard shell | Done |
| **Sprint 2** | Course CRUD, lecturer dashboard, course detail + analytics, profile pages | Done |
| **Sprint 3** | Session creation (GPS), QR generation, WhatsApp share, student attend flow, geofence verification | Done |
| **Sprint 4** | Live SSE attendee list, active session page, session auto-close, student history | Done |
| **Sprint 5** | Closed session record, CSV export, password change, level enforcement, role guards, error boundary | Done |
| **Sprint 6** | Device sign-in protection, UI/UX polish, copy review, email domain enforcement, bug fixes | Done |
| **Sprint 7** | Manual attendance marking, enrollment lists, student search API | Done |
| **Sprint 8** | E2E testing, performance testing, security audit | Pending |
