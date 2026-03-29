# Attendly

> One scan. Attendance done.

Attendly eliminates roll calls. Lecturers open a session, students scan a QR code, and attendance is automatically verified and recorded — with no hardware, no app install, and no manual effort.

---

## The Problem

University attendance in Nigeria is largely manual — paper lists, verbal roll calls, or shared sign-in sheets. These are slow, error-prone, and trivially gamed. A student can sign a sheet, or have a friend sign it for them, from anywhere.

## The Solution

Attendly ties attendance to three things that are hard to fake simultaneously: **identity** (authenticated student account), **location** (GPS within metres of the classroom), and **device** (one sign-in per physical device per session).

The lecturer creates a session from their phone — GPS is captured automatically. A QR code is generated and shared to the class WhatsApp group. Students scan it, browser geolocation is checked, and attendance is confirmed in one tap.

---

## How It Works

1. **Lecturer** creates a session — selects course, sets time limit, optionally restricts by student level
2. System captures GPS location and generates a **unique, time-bound QR code**
3. Lecturer shares the QR or attendance link to the **class WhatsApp group**
4. **Students** scan → GPS proximity is verified against the classroom location
5. One tap → attendance confirmed, record saved instantly

---

## What Makes It Reliable

| Mechanism | What it prevents |
|---|---|
| GPS geofencing | Students signing in from outside the building |
| Device UUID | Two students sharing one phone |
| Browser fingerprint | Bypassing device check via incognito or cleared storage |
| IP deduplication | Multiple sign-ins from the same network connection |
| Level enforcement | Wrong-year students signing a session they shouldn't attend |
| Enrollment lists | Non-enrolled students claiming attendance |
| Session expiry | Sign-ins after class has ended |

Lecturers can also manually mark students present — for those without a phone or internet access — directly from the live session view.

---

## Features

- **Live attendee list** — real-time updates as students sign in (Server-Sent Events)
- **Course analytics** — per-session records, per-student attendance percentages, CSV export
- **Enrollment lists** — CSV import of enrolled matric numbers; restricts sign-in to listed students
- **WhatsApp sharing** — one-tap share of the QR or attendance link
- **Password reset** — email-based reset flow
- **Role-based access** — separate lecturer and student dashboards; students require a `@student.funaab.edu.ng` email

---

## Tech Stack

| | |
|---|---|
| Frontend | Next.js (App Router, TypeScript) |
| Styling | Vanilla CSS with custom design tokens |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens) + bcrypt |
| QR Generation | `qrcode` — server-side PNG |
| Real-time | Server-Sent Events (SSE) |
| Hosting | Vercel · Render · Railway |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Install

```bash
git clone https://github.com/your-username/attendly.git
cd Attendly

cd server && npm install
cd ../client && npm install
```

### Configure

**`server/.env`**
```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/attendly
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
CLIENT_URL=http://localhost:3000
```

**`client/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Run

```bash
# Set up database
cd server && npx prisma migrate deploy && npx prisma generate

# Start backend (port 4000)
cd server && npm run dev

# Start frontend (port 3000)
cd client && npm run dev
```

---

## Project Structure

```
Attendly/
  client/       # Next.js frontend — student and lecturer dashboards, attend flow
  server/       # Express.js API — auth, sessions, attendance, courses, users
  prisma/       # Schema and migration history
  docs/         # Product spec, SRS, technical architecture, wireframes
```

---

## Technical Reference

API docs, database schema, device sign-in protection details, and sprint history are in [TECHNICAL.md](TECHNICAL.md).

---

## License

TBD
