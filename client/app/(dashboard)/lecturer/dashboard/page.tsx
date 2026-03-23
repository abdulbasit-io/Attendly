export default function LecturerDashboardPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">Manage your courses and attendance sessions</p>
        </div>
        <button className="btn btn-primary">
          Create Course
        </button>
      </div>

      {/* Placeholder — will be built in Sprint 2 */}
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
          No courses yet
        </p>
        <p style={{ fontSize: 'var(--font-size-sm)' }}>
          Create your first course to get started
        </p>
        <button className="btn btn-primary btn-sm">
          Create Course
        </button>
      </div>
    </div>
  );
}
