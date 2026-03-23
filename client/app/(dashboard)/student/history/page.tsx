'use client';

import { CheckCircle } from 'lucide-react';
import { useAttendanceHistory } from '@/lib/hooks';

export default function StudentHistoryPage() {
  const { history, loading, error } = useAttendanceHistory();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Attendance History</h1>
          <p className="page-subtitle">Your complete attendance record across all courses</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckCircle size={48} /></div>
          <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            No attendance records yet
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)' }}>
            Scan a QR code from your lecturer to sign attendance
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const date = new Date(item.signedAt);
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        {item.session.course.courseTitle}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {item.session.course.courseCode}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                      {date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                      {date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className="badge badge-green">
                        <CheckCircle size={10} />
                        Present
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
