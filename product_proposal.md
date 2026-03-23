# Attendly — Product Proposal

**Version:** 1.0
**Date:** March 23, 2026
**Prepared by:** Attendly Product Team

---

## 1. Executive Summary

**Attendly** is a location-smart, QR-based attendance system designed to eliminate the inefficiency and fraud of manual attendance in universities. By combining a simple QR scan with GPS-based proximity verification, Attendly ensures that only physically present students can mark attendance — in under 3 seconds, with zero paperwork.

> **Tagline:** *"With Attendly, attendance is as simple as a single scan."*

---

## 2. Problem Statement

### The Current Reality

University attendance is broken:

| Pain Point | Impact |
|---|---|
| **Manual roll calls** waste 5–15 minutes of every lecture | ~10% of total lecture time lost across a semester |
| **Paper sign-in sheets** are easily forged | Students sign for absent friends routinely |
| **No centralized records** | Lecturers manually compile attendance in spreadsheets, prone to errors |
| **No real-time visibility** | Lecturers don't know actual turnout until after class |
| **Student accountability is low** | Without reliable tracking, attendance policies are unenforceable |

### Why Existing Solutions Fail

- **Biometric systems** (fingerprint/facial recognition) require expensive hardware installation per classroom
- **Bluetooth/NFC beacons** need physical infrastructure in every room
- **Generic QR apps** don't verify location — students can scan from their hostels
- **LMS-based attendance** (Moodle, etc.) is clunky and not designed for in-class, real-time use

---

## 3. Proposed Solution

Attendly is a **mobile-first web application** that requires **zero hardware** — only a smartphone with GPS and a browser.

### Core Flow

1. Lecturer opens Attendly → selects course → sets time limit → **creates session**
2. System captures lecturer's GPS location and generates a **unique QR code**
3. Lecturer shares QR code image via **WhatsApp group** (or projects on screen)
4. Students scan the QR code → system verifies their **GPS proximity** to the class
5. If within range → one-tap confirmation → **attendance recorded**

### Key Differentiators

| Feature | Attendly | Competitors |
|---|---|---|
| Location verification | ✅ GPS geofencing | ❌ Most don't verify |
| Hardware required | ❌ None | ✅ Beacons / fingerprint readers |
| Setup time | Instant | Days to weeks |
| Cost per classroom | $0 | $100–$500+ |
| WhatsApp integration | ✅ Native share | ❌ Rarely |
| Time to sign in | < 3 seconds | 5–30 seconds |

---

## 4. Target Market

### Primary: Nigerian Universities (Beachhead)

- **400+** universities (federal, state, private)
- **~2.5 million** enrolled students
- WhatsApp is the dominant communication platform for student-lecturer coordination
- High smartphone penetration among students
- Few existing digital attendance solutions adopted at scale

### Expansion Path

1. **Phase 1:** Nigerian universities (pilot → scale)
2. **Phase 2:** Other West African universities (Ghana, Cameroon)
3. **Phase 3:** Broader African market + other emerging markets with similar dynamics

---

## 5. Value Proposition

### For Lecturers

- **Save 10+ minutes per lecture** — no more roll calls
- **Eliminate attendance fraud** — GPS proves physical presence
- **Real-time dashboard** — see who's in class right now
- **Exportable records** — one-click CSV export for department submissions
- **Course-level analytics** — identify chronically absent students

### For Students

- **One scan, done** — no queues, no forms, no signatures
- **Transparent records** — view your own attendance history and percentages
- **Fair system** — everyone is held to the same standard

### For University Administration

- **Institutional compliance** — accurate attendance data for accreditation
- **Zero infrastructure cost** — no hardware to buy or maintain
- **Data-driven decisions** — aggregate analytics across departments

---

## 6. Revenue Model

### Freemium SaaS

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0 / forever | Up to 3 courses, 50 students per session, 30-day history |
| **Pro** (Lecturer) | $3/month | Unlimited courses, unlimited students, full history, CSV export, analytics |
| **Institution** | Custom pricing | Bulk licensing, admin dashboard, department-level analytics, SSO, API access |

### Revenue Projections (Conservative)

| Milestone | Timeline | Revenue (Monthly) |
|---|---|---|
| 100 Pro lecturers | Month 6 | $300 |
| 1,000 Pro lecturers | Month 12 | $3,000 |
| 5 institutional contracts | Month 18 | $5,000–15,000 |

---

## 7. Go-to-Market Strategy

### Phase 1: Campus Ambassador Program (Month 1–3)

- Recruit 2–3 student ambassadors per target university
- Ambassadors onboard lecturers in their departments
- Incentive: Pro accounts + referral bonuses

### Phase 2: Department Pilots (Month 3–6)

- Partner with 5–10 departments for official pilots
- Provide free Pro access during pilot period
- Collect testimonials and usage data

### Phase 3: Institutional Sales (Month 6–12)

- Use pilot data to pitch to university management
- Offer institution-wide licensing
- Target accreditation and compliance angle

### Marketing Channels

| Channel | Approach |
|---|---|
| **WhatsApp** | Viral among lecturers and student groups |
| **Twitter/X** | Edtech thought leadership, product updates |
| **Campus events** | Demo booths at orientations and faculty workshops |
| **SEO/Blog** | Content on attendance best practices, edtech in Africa |

---

## 8. Success Metrics & KPIs

| Metric | Target (6 months) |
|---|---|
| Registered lecturers | 500+ |
| Registered students | 10,000+ |
| Sessions created per week | 200+ |
| Average sign-in time | < 3 seconds |
| Attendance fraud rate | < 2% |
| NPS score | ≥ 50 |

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Poor GPS accuracy indoors | High | Medium | Configurable geofence radius + Wi-Fi-assisted location |
| Low lecturer adoption | Medium | High | Ambassador program + department pilots |
| WhatsApp policy changes | Low | Medium | Support multiple sharing channels (Telegram, email, projector) |
| Student privacy concerns | Medium | Medium | Transparent privacy policy; location used only for verification, not tracking |
| Competitor entry | Medium | Medium | First-mover advantage + deep university relationships |

---

## 10. Timeline Overview

| Phase | Timeline | Deliverable |
|---|---|---|
| Planning & Design | Weeks 1–2 | Wireframes, technical architecture, UI design |
| MVP Development | Weeks 3–8 | Core features (auth, courses, sessions, QR, geofence, attendance) |
| Internal Testing | Weeks 9–10 | Bug fixes, performance testing |
| Beta Launch | Weeks 11–12 | 2–3 university pilot |
| Public Launch | Week 14 | Open registration + ambassador program |

---

## 11. Budget Estimate (MVP Phase)

| Category | Estimated Cost |
|---|---|
| Domain + Hosting (12 months) | $100–$200 |
| Email service (transactional) | $0–$20/month |
| SSL certificate | $0 (Let's Encrypt) |
| Open-source tools | $0 |
| Marketing (campus events, swag) | $200–$500 |
| **Total (MVP Year 1)** | **$500–$1,200** |

> [!NOTE]
> Budget is intentionally lean. The entire stack uses open-source tools with no paid API dependencies.
