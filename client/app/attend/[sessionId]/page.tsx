export default function AttendPage({ params }: { params: { sessionId: string } }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        background: 'var(--color-surface)',
      }}
    >
      <div
        className="card card-padded"
        style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Sign Attendance
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
          Session: {params.sessionId}
        </p>
        <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
        <p
          style={{
            marginTop: 'var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          Loading session... — Full flow coming in Sprint 3.
        </p>
      </div>
    </div>
  );
}
