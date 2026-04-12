import Link from 'next/link';
import { MapPin, Zap, Clock, Users, BarChart2, Smartphone } from 'lucide-react';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.logo}>Attendly</span>
          <div className={styles.navActions}>
            <Link href="/login" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
            <Link href="/register/lecturer" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className="badge badge-green">University attendance, reimagined</span>
          </div>
          <h1 className={styles.heroHeading}>
            Attendance as simple as<br />
            <span className={styles.heroAccent}>a single scan</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Lecturers create a session, share a QR code via WhatsApp,
            Students scan to confirm. GPS verifies they are in the room.
            No hardware. No roll calls. No apps to install.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/register/lecturer" className="btn btn-primary btn-lg">
              I&apos;m a Lecturer
            </Link>
            <Link href="/register/student" className="btn btn-secondary btn-lg">
              I&apos;m a Student
            </Link>
          </div>
          <p className={styles.heroNote}>Free to use. Works on any smartphone.</p>
        </div>

        {/* Hero visual */}
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardHeader}>
              <div className={styles.heroCardDot} style={{ background: '#C62828' }} />
              <div className={styles.heroCardDot} style={{ background: '#E65100' }} />
              <div className={styles.heroCardDot} style={{ background: '#2E7D32' }} />
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Active Session
              </span>
            </div>
            <div className={styles.heroCardBody}>
              <div className={styles.qrMock}>
                <div className={styles.qrGrid} />
                <div className={styles.qrLabel}>MTE 504: Scan to attend</div>
              </div>
              <div className={styles.attendeeList}>
                {['Amina B.', 'Chukwuemeka O.', 'Fatima A.', 'Ibrahim D.'].map((name, i) => (
                  <div key={name} className={styles.attendeeItem} style={{ animationDelay: `${i * 0.15}s` }}>
                    <div className={styles.attendeeAvatar}>
                      {name.charAt(0)}
                    </div>
                    <span className={styles.attendeeName}>{name}</span>
                    <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '11px' }}>
                      Present
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className={styles.howSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>How it works</div>
          <h2 className={styles.sectionHeading}>Three steps to mark attendance</h2>
          <div className={styles.steps}>
            {[
              {
                number: '01',
                title: 'Lecturer starts a session',
                desc: 'Select your course, set a time limit, and tap Create. Your phone captures your GPS location automatically.',
              },
              {
                number: '02',
                title: 'Share the QR via WhatsApp',
                desc: 'A unique QR code is generated. Share it to your class group with one tap. No projector needed.',
              },
              {
                number: '03',
                title: 'Students scan and confirm',
                desc: 'Students scan the QR, GPS verifies they are physically present, and attendance is marked in one tap.',
              },
            ].map((step) => (
              <div key={step.number} className={styles.step}>
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionLabel}>Why Attendly</div>
          <h2 className={styles.sectionHeading}>Everything you need, nothing you don&apos;t</h2>
          <div className={styles.featuresGrid}>
            {[
              {
                icon: <MapPin size={20} />,
                title: 'Location-verified',
                desc: 'GPS geofencing ensures only physically present students can sign in. No proxies, no remote check-ins.',
              },
              {
                icon: <Zap size={20} />,
                title: 'One scan, done',
                desc: "Students tap once. Name and matric number are auto-filled from their account. No typing, no delays.",
              },
              {
                icon: <Clock size={20} />,
                title: 'Time-bound sessions',
                desc: "Sessions auto-close after your set duration. Late arrivals are locked out automatically.",
              },
              {
                icon: <Users size={20} />,
                title: 'Live attendee list',
                desc: "Watch students sign in live during the session. Real-time updates as they scan.",
              },
              {
                icon: <BarChart2 size={20} />,
                title: 'Course analytics',
                desc: "Per-session records, cumulative stats, per-student attendance percentage. Export to CSV anytime.",
              },
              {
                icon: <Smartphone size={20} />,
                title: 'Zero infrastructure',
                desc: "No beacons, no dedicated hardware, no app to install. Works in any mobile browser.",
              },
            ].map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof strip ──────────────────────────────── */}
      <section className={styles.proofSection}>
        <div className={styles.sectionInner}>
          <div className={styles.proofStats}>
            {[
              { value: '< 30s', label: 'Average sign-in time' },
              { value: '0', label: 'Hardware required' },
              { value: '100%', label: 'Mobile-browser native' },
              { value: 'GPS', label: 'Proximity verified' },
            ].map((stat) => (
              <div key={stat.label} className={styles.proofStat}>
                <div className={styles.proofStatValue}>{stat.value}</div>
                <div className={styles.proofStatLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaHeading}>Ready to end the roll call?</h2>
          <p className={styles.ctaSubtitle}>
            Join lecturers who&apos;ve replaced slow attendance with a single scan.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/register/lecturer" className="btn btn-primary btn-lg">
              Start as a Lecturer
            </Link>
            <Link href="/register/student" className="btn btn-secondary btn-lg">
              Sign up as a Student
            </Link>
          </div>
          <p className={styles.ctaNote}>
            Already have an account?{' '}
            <Link href="/login" className={styles.ctaLink}>Sign in</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerLogo}>Attendly</span>
          <span className={styles.footerTagline}>Attendance as simple as a single scan.</span>
        </div>
      </footer>
    </div>
  );
}
