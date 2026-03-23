export default function SessionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Session</h1>
          <p className="page-subtitle">Session ID: {params.id}</p>
        </div>
      </div>
      <div className="card card-padded" style={{ maxWidth: 500 }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Active session view (QR display, live attendee list, timer, end session) — coming in Sprint 3.
        </p>
      </div>
    </div>
  );
}
