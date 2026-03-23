# Attendly

> *"With Attendly, attendance is as simple as a single scan."*

**Attendly** is a location-smart, QR-based attendance system for universities. Lecturers create time-bound sessions, share a QR code via WhatsApp, and students scan to mark attendance — verified by GPS proximity. No hardware. No roll calls. Just scan.

---

## How It Works

1. **Lecturer** creates an attendance session (selects course, sets time limit)
2. System captures the lecturer's GPS and generates a **unique QR code**
3. Lecturer shares the QR image to the class **WhatsApp group**
4. **Students** scan the QR → system verifies they're physically near the class
5. One tap → ✅ attendance confirmed

## Key Features

- **Location-verified** — GPS geofencing ensures only present students sign in
- **One-scan simple** — students tap once; name and matric auto-fill
- **Time-bound sessions** — auto-close after the lecturer's set duration
- **Course analytics** — per-session records, cumulative stats, CSV export
- **Zero infrastructure** — no beacons, no hardware, just phones

## Tech Principles

- **Open-source stack** — Browser Geolocation API, OpenStreetMap, open-source QR libraries
- **Mobile-first web app** — works in any modern browser, no app install needed
- **WhatsApp-native sharing** — QR image shared via URL scheme

## Project Status

**Pre-development** — product specification and architecture in progress.

## License

TBD
