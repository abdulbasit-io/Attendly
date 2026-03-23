'use client';

import Link from 'next/link';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { useAttendanceHistory } from '@/lib/hooks';

type CourseGroup = {
  courseCode: string;
  courseTitle: string;
  attended: number;
  total: number;
};

export default function StudentDashboardPage() {
  const { history, loading, error } = useAttendanceHistory();

  // Group by course
  const courseMap: Record<string, CourseGroup> = {};
  history.forEach((item) => {
    const { courseCode, courseTitle } = item.session.course;
    const key = courseCode;
    if (!courseMap[key]) {
      courseMap[key] = { courseCode, courseTitle, attended: 0, total: 0 };
    }
    courseMap[key].attended += 1;
    courseMap[key].total += 1;
  });
  const courses = Object.values(courseMap);

  function getPercentageClass(pct: number) {
    if (pct >= 75) return 'badge-green';
    if (pct >= 50) return 'badge-amber';
    return 'badge-red';
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Track your attendance across all courses</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckCircle size={48} /></div>
          <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            No attendance records yet
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)' }}>
            When your lecturer shares a QR code, scan it to sign attendance
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {courses.map((course) => {
            const pct = course.total > 0 ? Math.round((course.attended / course.total) * 100) : 0;
            return (
              <div key={course.courseCode} className="card">
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)', marginBottom: '4px' }}>
                        {course.courseCode}
                      </div>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{course.courseTitle}</div>
                    </div>
                    <span className={`badge ${getPercentageClass(pct)}`}>{pct}%</span>
                  </div>
                  <div>
                    <div className="progress-bar">
                      <div
                        className={`progress-bar-fill ${pct < 50 ? 'danger' : pct < 75 ? 'warning' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {course.attended} of {course.total} sessions attended
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent sign-ins */}
      {history.length > 0 && (
        <div style={{ marginTop: 'var(--space-10)' }}>
          <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)' }}>
            Recent Sign-ins
          </h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((item) => (
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
                      {new Date(item.signedAt).toLocaleDateString('en-NG', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className="badge badge-green">
                        <CheckCircle size={10} />
                        Present
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {history.length > 10 && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
              <Link href="/student/history" className="btn btn-ghost btn-sm">
                View full history
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
