# Attendly

> *"With Attendly, attendance is as simple as a single scan."*

**Attendly** is a location-smart, QR-based attendance system for universities. Lecturers create time-bound sessions, share a QR code via WhatsApp, and students scan to mark attendance — verified by GPS proximity. No hardware. No roll calls. Just scan.

---

## How It Works

1. **Lecturer** creates an attendance session (selects course, sets time limit)
2. System captures the lecturer's GPS and generates a **unique QR code**
3. Lecturer shares the QR image to the class **WhatsApp group**
4. **Students** scan the QR → system verifies they're physically near the class
5. One tap → attendance confirmed

---

## Key Features

- **Location-verified** — GPS geofencing ensures only physically present students can sign in
- **One-scan simple** — students tap once; name and matric number auto-fill from their account
- **Time-bound sessions** — auto-close after the lecturer's set duration
- **Live attendee list** — real-time updates via SSE as students sign in
- **Course analytics** — per-session records, cumulative stats, per-student %, CSV export
- **Zero infrastructure** — no beacons, no hardware, no app to install. Works in any mobile browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) |
| Styling | Vanilla CSS (custom properties / design tokens) |
| Icons | Lucide React |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) + bcrypt |
| QR Generation | `qrcode` npm package (server-side PNG) |
| Real-time | Server-Sent Events (SSE) |
| Email | Nodemailer |
| Hosting | Vercel (frontend) · Railway/Render (backend) · Neon (database) |

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
      attend/[sessionId]/  # Public QR redirect target
    lib/                   # api.ts, auth.ts, geo.ts, hooks.ts
    styles/                # globals.css (design tokens), components.css
    components/            # Shared UI components

  server/                  # Express.js backend
    src/
      routes/              # auth, courses, sessions, attendance
      controllers/         # Thin request/response handlers
      services/            # Business logic
      utils/               # haversine.js, qrGenerator.js, tokens.js
    prisma/
      schema.prisma        # DB schema — User, Course, Session, Attendance

  docs/                    # Product, SRS, technical architecture, IA & wireframes
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech) / [Supabase](https://supabase.com))

### 1. Clone and install

```bash
git clone https://github.com/your-username/attendly.git
cd Attendly

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Fill in DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL

# Client
cp client/.env.local.example client/.env.local
# Fill in NEXT_PUBLIC_API_URL
```

### 3. Set up the database

```bash
cd server
npm run db:migrate    # Run Prisma migrations
npm run db:generate   # Generate Prisma client
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
User          — lecturer or student account
Course        — belongs to a lecturer
Session       — time-bound attendance window with GPS coords + QR
Attendance    — student sign-in record with distance verified
PasswordResetToken — for forgot password flow
```

---

## API Overview

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `login` · `refresh` · `forgot-password` · `reset-password` · `GET /me` · `PUT /profile` |
| Courses | `POST /api/courses` · `GET` · `GET /:id` · `PUT /:id` · `PATCH /:id/archive` |
| Sessions | `POST /api/sessions` · `GET /:id` · `PATCH /:id/close` · `GET /:id/stream` (SSE) · `GET /:id/info` |
| Attendance | `POST /api/attendance` · `GET /history` · `GET /course/:id` · `GET /course/:id/export` |

---

## Development Progress

| Sprint | Scope | Status |
|---|---|---|
| **Sprint 1** | Scaffolding, DB schema, design system, landing page, auth pages, dashboard shell | **Done** |
| **Sprint 2** | Course CRUD, lecturer dashboard, course detail + analytics, profile pages | **Done** |
| **Sprint 3** | Session creation (GPS), QR generation, WhatsApp share, student attend flow, geofence verification | In progress |
| **Sprint 4** | Live SSE attendee list, active session page, session auto-close, student history | Pending |
| **Sprint 5** | Analytics polish, profile editing, error states, responsive testing | Pending |
| **Sprint 6** | E2E testing, performance testing, security audit, production deploy | Pending |

---

## Design System

- **Primary color** — `#4A7C2E` (forest green)
- **Font** — Inter
- **Icons** — Lucide React (no emojis)
- **Breakpoints** — mobile `< 768px` · tablet `768–1024px` · desktop `> 1024px`
- **Principle** — mobile-first, minimalist, generous whitespace

---

## License

TBD
