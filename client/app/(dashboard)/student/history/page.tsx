export default function StudentHistoryPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Attendance History</h1>
          <p className="page-subtitle">Your full attendance record by course</p>
        </div>
      </div>
      <div className="empty-state">
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          No history yet — coming in Sprint 4.
        </p>
      </div>
    </div>
  );
}
