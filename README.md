# Attendly

> *"One scan. Attendance done."*

**Attendly** is a location-smart, QR-based attendance system built for FUNAAB. Lecturers create time-bound sessions, share a QR code via WhatsApp, and students scan to mark attendance — verified by GPS proximity. No hardware. No roll calls. Just scan.

---

## How It Works

1. **Lecturer** creates an attendance session (selects course, sets time limit, optionally restricts by student level)
2. System captures the lecturer's GPS and generates a **unique QR code**
3. Lecturer shares the QR image or direct attendance link to the class **WhatsApp group**
4. **Students** scan the QR → system verifies they are physically near the classroom
5. One tap → attendance confirmed, record saved instantly

---

## Key Features

- **Location-verified** — GPS geofencing ensures only physically present students can sign in
- **One-scan simple** — students tap once; name and matric number auto-fill from their account
- **Device-bound sign-in** — each device can only sign attendance once per session (UUID + browser fingerprint)
- **Level enforcement** — sessions can be restricted to a specific student level (100L–600L)
- **Time-bound sessions** — auto-close after the lecturer's set duration; manual close also available
- **Live attendee list** — real-time updates via SSE as students sign in during a session
- **Course analytics** — per-session records, cumulative stats, per-student attendance %, CSV export
- **WhatsApp sharing** — one-tap share of the QR or attendance link directly to a class group
- **Zero infrastructure** — no beacons, no hardware, no app to install; works in any mobile browser
- **Student email enforcement** — student accounts require a `@student.funaab.edu.ng` email address

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) |
| Styling | Vanilla CSS (custom design tokens) |
| Icons | Lucide React |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Auth | JWT (access + refresh tokens) + bcrypt |
| QR Generation | `qrcode` npm package (server-side PNG) |
| Real-time | Server-Sent Events (SSE) |
| Hosting | Vercel (frontend) · Render (backend) · Railway (database) |

---

## Project Structure

```
Attendly/
  client/                  # Next.js 16 frontend
    app/
      (public)/            # Landing, login, register, forgot/reset password
      (dashboard)/
        lecturer/          # Dashboard, course detail, session pages, profile
        student/           # Dashboard, history, profile
      attend/[sessionId]/  # QR scan target — student attendance flow
    lib/                   # api.ts, auth.ts, geo.ts, hooks.ts, device.ts
    styles/                # globals.css (design tokens), components.css

  server/                  # Express.js backend
    src/
      routes/              # auth, courses, sessions, attendance
      controllers/         # Thin request/response handlers
      services/            # Business logic
      middleware/          # auth.js, errorHandler.js
      utils/               # haversine.js, qrGenerator.js, tokens.js
    prisma/
      schema.prisma        # DB schema
      migrations/          # Migration history

  docs/                    # Product spec, SRS, technical architecture, IA & wireframes
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local, [Render](https://render.com), or [Railway](https://railway.app))

### 1. Clone and install

```bash
git clone https://github.com/your-username/attendly.git
cd Attendly

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

**`server/.env`**
```env
PORT=4000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@localhost:5432/attendly

JWT_SECRET=change-this-in-production
JWT_REFRESH_SECRET=change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=10
CLIENT_URL=http://localhost:3000

# Optional — for password reset emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```

**`client/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Set up the database

```bash
cd server
npx prisma migrate deploy   # Apply all migrations
npx prisma generate         # Generate Prisma client
```

### 4. Run in development

```bash
# Terminal 1 — backend
cd server && npm run dev    # http://localhost:4000

# Terminal 2 — frontend
cd client && npm run dev    # http://localhost:3000
```

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

Session
  id, courseId, lecturerId
  latitude, longitude, geofenceRadiusM (default 50m)
  timeLimitMinutes, level? (optional — restricts sign-in by student level)
  qrPayload (UNIQUE), status (ACTIVE | CLOSED)
  createdAt, expiresAt, closedAt?

Attendance
  id, sessionId, studentId
  deviceId?    — persistent browser UUID (one sign-in per device per session)
  fingerprint? — browser fingerprint hash (blocks incognito/localStorage bypass)
  latitude, longitude, distanceM
  signedAt
  UNIQUE (sessionId, studentId)
  UNIQUE (sessionId, deviceId)
  UNIQUE (sessionId, fingerprint)

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
data: {"id":"...","fullName":"...","matricNumber":"...","department":"...","signedAt":"...","distanceM":"12.50"}
```

---

#### `GET /api/sessions/:id/info` 🔒
Get public session info for the student attend flow (no attendee list, no QR image).

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
Sign attendance for a session. Verifies GPS proximity, level restriction, and device uniqueness.

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
| `409` | Student has already signed for this session |
| `409` | This device has already been used to sign attendance for this session |

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
Get aggregate attendance records for a course — per-student stats across all sessions.

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

## Device Sign-in Protection

Each attendance record captures two device signals to prevent a single device from being used by multiple students in the same session:

| Signal | How it works | Survives |
|---|---|---|
| **Device UUID** (`deviceId`) | UUID generated on first visit, stored in `localStorage` | Normal browser sessions |
| **Browser fingerprint** (`fingerprint`) | FNV-1a hash of user agent, screen, timezone, hardware concurrency, platform | Incognito mode, cleared localStorage |

Both are optional fields on the API — if omitted, only the per-student uniqueness constraint applies.

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
| **Sprint 7** | E2E testing, performance testing, security audit | Pending |

---

## Design System

- **Primary color** — `#4A7C2E` (forest green), gradient `#5E9438 → #3D6825`
- **Font** — Inter
- **Icons** — Lucide React
- **Breakpoints** — mobile `< 768px` · tablet `768–1024px` · desktop `> 1024px`
- **Principle** — mobile-first, minimalist, generous whitespace

---

## License

TBD
