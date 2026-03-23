# Attendly — Client Requirements Specification

**Version:** 1.0
**Date:** March 23, 2026
**Prepared by:** Attendly Product Team
**Client:** University administration, lecturers, and students

---

## 1. Purpose

This document captures the **client's requirements** for Attendly — what the end users and institutional stakeholders need the system to do, the constraints it must operate within, and the criteria by which delivery will be accepted. It is written from the client's perspective and serves as the contractual baseline for project delivery.

---

## 2. Business Objectives

| # | Objective |
|---|---|
| BO-1 | **Eliminate attendance fraud** — only physically present students can sign attendance |
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
| Trust | Confidence that only present students are recorded |
| Records | Access to historical attendance data, exportable as CSV |
| Course organization | Ability to manage multiple courses with per-course tracking |

### 3.2 Students

| Need | Description |
|---|---|
| Simplicity | Mark attendance in ≤ 2 taps after scanning QR |
| Transparency | View own attendance record and percentage at any time |
| Fairness | System applied equally — no manual overrides |
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
| CR-02 | Students register with: full name, department, matric number, email, gender, password |
| CR-03 | Email must be unique across all users |
| CR-04 | Matric number must be unique among students |
| CR-05 | Password reset must be available via email |

### 4.2 Course & Session Management

| Req ID | Requirement |
|---|---|
| CR-06 | Lecturers must be able to create courses (code + title) |
| CR-07 | Lecturers must be able to create attendance sessions tied to a course with a configurable time limit |
| CR-08 | System must capture the lecturer's GPS location at session creation |
| CR-09 | System must generate a unique QR code per session |
| CR-10 | QR code must be downloadable as an image and shareable to WhatsApp |
| CR-11 | Sessions must auto-close when the time limit is reached |
| CR-12 | Lecturers must be able to manually close sessions early |

### 4.3 Attendance Sign-In

| Req ID | Requirement |
|---|---|
| CR-13 | Students must sign in by scanning a QR code |
| CR-14 | System must capture the student's GPS and verify proximity to the class |
| CR-15 | Only students within a defined radius (default ~50m) may sign in |
| CR-16 | Student details (name, matric number) must auto-fill — no manual data entry |
| CR-17 | Students must receive immediate confirmation or a clear error message |
| CR-18 | Duplicate sign-in for the same session must be prevented |

### 4.4 Records & Reporting

| Req ID | Requirement |
|---|---|
| CR-19 | Lecturers must view per-session attendance lists (name, matric no, department, time) |
| CR-20 | Lecturers must export attendance records as CSV |
| CR-21 | Students must view their own attendance history and percentage per course |

---

## 5. Constraints

| Constraint | Detail |
|---|---|
| **Technology** | All core technologies must be open-source (no paid API dependencies for location, QR, or maps) |
| **Infrastructure** | Zero hardware required in classrooms — the system relies only on users' smartphones |
| **Platform** | Must work in a mobile browser (Chrome, Safari) — no app store installation required for MVP |
| **Connectivity** | Must function on 3G/4G networks common on university campuses |
| **WhatsApp sharing** | Must use the WhatsApp URL/share scheme (no Business API required) |
| **Data residency** | No specific data residency requirements for MVP; server may be cloud-hosted anywhere |

---

## 6. Data & Privacy Requirements

| Req ID | Requirement |
|---|---|
| DP-01 | Location data is used **only** for attendance verification at the moment of scan — not for tracking |
| DP-02 | Student location coordinates are stored only as part of the attendance record (for audit) |
| DP-03 | Passwords must be hashed; never stored or transmitted in plain text |
| DP-04 | All communication between client and server must be encrypted (HTTPS) |
| DP-05 | Lecturers can export and delete their course data |
| DP-06 | Students can view all data the system holds about them |

---

## 7. Delivery Milestones

| Milestone | Definition | Acceptance Gate |
|---|---|---|
| **M1 — Design Complete** | Wireframes, data model, API design approved | Client sign-off on product spec |
| **M2 — Auth & Courses** | Registration, login, password reset, course CRUD functional | Demo with test accounts |
| **M3 — Core Attendance** | Session creation, QR generation, scan + location verification, sign-in flow | End-to-end demo (lecturer creates → student signs) |
| **M4 — Records & Export** | Attendance records, student history, CSV export | Export verified against test data |
| **M5 — Beta** | Full system deployed, tested with real users at 1–2 departments | No critical bugs; ≥ 20 real sessions completed |
| **M6 — Production Launch** | Public release with stable infrastructure | Uptime ≥ 99.5% over 7 days |

---

## 8. Acceptance Criteria

The system will be considered **accepted** when:

1. ✅ A lecturer can register, create a course, start a session, and share a QR code — all within 60 seconds
2. ✅ A student can scan the QR code and confirm attendance in ≤ 2 taps (< 5 seconds total)
3. ✅ A student scanning from > 100m away is **rejected** with a clear error
4. ✅ A student scanning after the session expires is **rejected** with a clear error
5. ✅ Duplicate sign-in attempts are blocked
6. ✅ The lecturer can view the real-time attendee list during an active session
7. ✅ The lecturer can export a session's attendance as CSV with correct data
8. ✅ The student can view their own attendance history and percentage
9. ✅ All location and authentication features use open-source technologies only
10. ✅ The system functions correctly on mobile Chrome and Safari over a 3G connection

---

## 9. Warranty & Support

| Item | Expectation |
|---|---|
| Bug fixes | Critical bugs addressed within 24 hours post-launch |
| Support period | 30-day post-launch support included |
| Uptime SLA | 99.5% during university operating hours (8 AM – 8 PM local time) |
| Documentation | User guide for lecturers and students provided at launch |
