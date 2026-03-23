export default function StudentDashboardPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Track your attendance across all courses</p>
        </div>
      </div>

      <div className="empty-state">
        <div className="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
          No attendance records yet
        </p>
        <p style={{ fontSize: 'var(--font-size-sm)' }}>
          Scan a QR code shared by your lecturer to sign attendance
        </p>
      </div>
    </div>
  );
}
