# Attendly — Client Requirements Specification

**Version:** 1.1
**Date:** March 29, 2026
**Prepared by:** Attendly Product Team
**Client:** University administration, lecturers, and students

---

## 1. Purpose

This document captures the **client's requirements** for Attendly — what the end users and institutional stakeholders need the system to do, the constraints it must operate within, and the criteria by which delivery will be accepted. It is written from the client's perspective and serves as the contractual baseline for project delivery.

---

## 2. Business Objectives

| # | Objective |
|---|---|
| BO-1 | **Eliminate attendance fraud** — only physically present, verified students can sign attendance |
| BO-2 | **Reduce time spent on attendance** — from 5–15 minutes per lecture to under 30 seconds |
| BO-3 | **Provide verifiable attendance records** — exportable, auditable data for departmental compliance |
| BO-4 | **Require zero infrastructure investment** — no hardware, no installation, no IT support |
| BO-5 | **Work with existing communication channels** — lecturers already use WhatsApp groups |

---

## 3. Stakeholder Needs

### 3.1 Lecturers

| Need | Description |
|---|---|
| Ease of use | Must be intuitive enough to use mid-lecture without training |
| Speed | Session creation and QR sharing in under 30 seconds |
| Trust | Confidence that only present, eligible students are recorded |
| Control | Ability to restrict sessions by student level and enforce enrollment lists |
| Override | Ability to manually mark students who cannot sign in digitally |
| Records | Access to historical attendance data, exportable as CSV |
| Course organisation | Ability to manage multiple courses with per-course tracking |

### 3.2 Students

| Need | Description |
|---|---|
| Simplicity | Mark attendance in ≤ 2 taps after opening the attendance link |
| Transparency | View own attendance record and percentage at any time |
| Fairness | System applied consistently; edge cases handled via manual marking |
| Privacy | Location used only for verification, not continuous tracking |

### 3.3 University Administration

| Need | Description |
|---|---|
| Compliance | Accurate records suitable for accreditation reviews |
| Cost | Zero upfront cost and minimal ongoing cost |
| Reliability | System available during class hours without outages |
| Data ownership | University/lecturers own their data; exportable at will |

---

## 4. Functional Expectations

### 4.1 User Registration

| Req ID | Requirement |
|---|---|
| CR-01 | Lecturers register with: full name, email, password |
| CR-02 | Students register with: full name, department, matric number, email, level, gender, password |
| CR-03 | Student email must end in `@student.funaab.edu.ng` |
| CR-04 | Email must be unique across all users |
| CR-05 | Matric number must be unique among students |
| CR-06 | Password reset must be available via email link |

### 4.2 Course & Session Management

| Req ID | Requirement |
|---|---|
| CR-07 | Lecturers must be able to create, edit, and archive courses (code + title) |
| CR-08 | Lecturers must be able to import an enrollment list (matric numbers) per course; when active, only enrolled students may sign in |
| CR-09 | Lecturers must be able to create attendance sessions tied to a course with a configurable time limit (1–180 minutes) |
| CR-10 | System must capture the lecturer's GPS location at session creation |
| CR-11 | Lecturers must be able to set the geofence radius per session (default: 250 m) |
| CR-12 | Lecturers must be able to optionally restrict a session to a specific student level (100L–600L) |
| CR-13 | System must generate a unique QR code per session |
| CR-14 | QR code must be downloadable as PNG and shareable to WhatsApp |
| CR-15 | Sessions must auto-close when the time limit is reached |
| CR-16 | Lecturers must be able to manually close sessions early |

### 4.3 Attendance Sign-In

| Req ID | Requirement |
|---|---|
| CR-17 | Students sign in by opening the attendance link in their mobile browser (via QR scan with phone camera or shared link) |
| CR-18 | System must capture the student's GPS and verify proximity to the classroom |
| CR-19 | Only students within the configured geofence radius may sign in |
| CR-20 | If a session has a level restriction, only students at that level may sign in |
| CR-21 | If a course has an active enrollment list, only listed students may sign in |
| CR-22 | Student details (name, matric number) must auto-fill — no manual data entry required |
| CR-23 | Each device may only be used to sign attendance once per session |
| CR-24 | Students must receive immediate confirmation or a clear, reason-specific error message |
| CR-25 | Duplicate sign-in for the same student in the same session must be prevented |

### 4.4 Records, Reporting & Overrides

| Req ID | Requirement |
|---|---|
| CR-26 | Lecturers must view per-session attendance lists (name, matric number, department, distance, sign-in time, method) |
| CR-27 | Lecturers must view cumulative per-student attendance statistics per course |
| CR-28 | Lecturers must export attendance records as CSV |
| CR-29 | Lecturers must be able to manually mark any registered student as present during an active session |
| CR-30 | Students must view their own attendance history and percentage per course |

---

## 5. Constraints

| Constraint | Detail |
|---|---|
| **Technology** | All core technologies must be open-source (no paid API dependencies for location, QR, or maps) |
| **Infrastructure** | Zero hardware required in classrooms — system relies only on users' smartphones |
| **Platform** | Must work in a mobile browser (Chrome, Safari) — no app store installation required |
| **Connectivity** | Must function on 3G/4G networks common on university campuses |
| **WhatsApp sharing** | Must use the WhatsApp URL/share scheme (no Business API required) |
| **Data residency** | No specific data residency requirements for MVP; server may be cloud-hosted anywhere |

---

## 6. Data & Privacy Requirements

| Req ID | Requirement |
|---|---|
| DP-01 | Location data is used **only** for attendance verification at the moment of sign-in — not for tracking |
| DP-02 | Student location coordinates are stored only as part of the attendance record (for audit) |
| DP-03 | Device identifiers (UUID, fingerprint, IP) are stored per session only — used to prevent device sharing, not for profiling |
| DP-04 | Passwords must be hashed; never stored or transmitted in plain text |
| DP-05 | All communication between client and server must be encrypted (HTTPS) |
| DP-06 | Lecturers can export and archive their course data |
| DP-07 | Students can view all attendance data the system holds about them |

---

## 7. Delivery Milestones

| Milestone | Definition | Status |
|---|---|---|
| **M1 — Design Complete** | Wireframes, data model, API design approved | Done |
| **M2 — Auth & Courses** | Registration, login, password reset, course CRUD functional | Done |
| **M3 — Core Attendance** | Session creation, QR generation, scan + location verification, sign-in flow | Done |
| **M4 — Records & Export** | Attendance records, student history, CSV export | Done |
| **M5 — Advanced Features** | Level enforcement, enrollment lists, manual marking, device sign-in protection | Done |
| **M6 — Beta** | Full system deployed, tested with real users at 1–2 departments | Pending |
| **M7 — Production Launch** | Public release with stable infrastructure | Pending |

---

## 8. Acceptance Criteria

The system will be considered **accepted** when:

1. A lecturer can register, create a course, start a session, and share a QR code — all within 60 seconds
2. A student can open the attendance link and confirm attendance in ≤ 2 taps (< 5 seconds total)
3. A student signing in from > configured radius is rejected with a clear error showing their distance
4. A student signing in after the session expires is rejected with a clear error
5. A student whose level does not match the session restriction is rejected
6. A student not on the course enrollment list is rejected when a list is active
7. A second student attempting to sign in from a device already used in the same session is rejected
8. Duplicate sign-in attempts by the same student are blocked
9. The lecturer can view the real-time attendee list during an active session
10. The lecturer can manually mark a registered student as present
11. The lecturer can export a course's attendance records as CSV with correct data
12. The student can view their own attendance history and percentage
13. All location and authentication features use open-source technologies only
14. The system functions correctly on mobile Chrome and Safari over a 3G connection

---

## 9. Warranty & Support

| Item | Expectation |
|---|---|
| Bug fixes | Critical bugs addressed within 24 hours post-launch |
| Support period | 30-day post-launch support included |
| Uptime SLA | 99.5% during university operating hours (8 AM – 8 PM local time) |
| Documentation | User guide for lecturers and students provided at launch |
