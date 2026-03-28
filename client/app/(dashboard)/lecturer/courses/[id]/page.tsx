'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Archive,
  BarChart2,
  List,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Download,
} from 'lucide-react';
import { useCourse, useCourseAttendance, Session, AttendanceRecord } from '@/lib/hooks';
import { api, ApiError } from '@/lib/api';
import styles from './course.module.css';

// ── Tab type ──────────────────────────────────────────────────
type Tab = 'sessions' | 'analytics';

// ── Session row ───────────────────────────────────────────────
function SessionRow({ session }: { session: Session & { _count?: { attendances: number } } }) {
  const date = new Date(session.createdAt);
  const isActive = session.status === 'ACTIVE';
  const attendeeCount = session._count?.attendances ?? 0;

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
          {date.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </td>
      <td>
        <span className={`badge ${isActive ? 'badge-green' : 'badge-gray'}`}>
          {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
          {isActive ? 'Active' : 'Closed'}
        </span>
      </td>
      <td>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-sm)' }}>
          <Users size={13} color="var(--color-text-secondary)" />
          {attendeeCount}
        </span>
      </td>
      <td>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {session.timeLimitMinutes} min
        </span>
      </td>
      <td>
        <Link
          href={`/lecturer/sessions/${session.id}`}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 'var(--font-size-xs)' }}
        >
          View
        </Link>
      </td>
    </tr>
  );
}

// ── Analytics tab ─────────────────────────────────────────────
function AnalyticsTab({ courseId }: { courseId: string }) {
  const { records, stats, loading, error } = useCourseAttendance(courseId);

  async function handleExport() {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/attendance/course/${courseId}/export`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return;
    const csv = await res.text();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${courseId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  function getPercentageBadge(pct: number) {
    if (pct >= 75) return 'badge-green';
    if (pct >= 50) return 'badge-amber';
    return 'badge-red';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className="stat-card">
          <div className="stat-card-value">{stats.totalSessions}</div>
          <div className="stat-card-label">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{stats.totalStudents}</div>
          <div className="stat-card-label">Students Signed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">
            {stats.totalStudents > 0 && stats.totalSessions > 0
              ? Math.round(
                  records.reduce((sum, r) => sum + r.percentage, 0) / records.length
                )
              : 0}%
          </div>
          <div className="stat-card-label">Avg Attendance</div>
        </div>
      </div>

      {/* Per-student table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
            Student Breakdown
          </h3>
          {records.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>
              <Download size={14} />
              Export CSV
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No attendance records yet</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Matric</th>
                  <th>Department</th>
                  <th>Attended</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record: AttendanceRecord) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{record.fullName}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{record.matricNumber || '—'}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{record.department || '—'}</td>
                    <td>
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>
                        {record.attended} / {record.total}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ width: 64 }}>
                          <div className="progress-bar">
                            <div
                              className={`progress-bar-fill ${record.percentage < 50 ? 'danger' : record.percentage < 75 ? 'warning' : ''}`}
                              style={{ width: `${record.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className={`badge ${getPercentageBadge(record.percentage)}`}>
                          {record.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Course Detail ────────────────────────────────────────
export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const { course, sessions, loading, error, refetch } = useCourse(courseId);
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [archiving, setArchiving] = useState(false);

  async function handleArchive() {
    if (!course) return;
    setArchiving(true);
    try {
      await api.patch(`/api/courses/${courseId}/archive`);
      refetch();
    } catch {
      //
    } finally {
      setArchiving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div>
        <div className="alert alert-error">{error || 'Course not found'}</div>
        <button className="btn btn-ghost" style={{ marginTop: 'var(--space-4)' }} onClick={() => router.back()}>
          Go back
        </button>
      </div>
    );
  }

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
  const closedSessions = sessions.filter((s) => s.status === 'CLOSED');

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ marginBottom: 'var(--space-5)' }}>
        <Link href="/lecturer/dashboard" className="breadcrumb-item">
          <span>Courses</span>
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{course.courseCode}</span>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h1 className="page-title">{course.courseTitle}</h1>
            <span className="badge badge-brand">{course.courseCode}</span>
            {course.isArchived && <span className="badge badge-gray"><Archive size={10} /> Archived</span>}
          </div>
          <p className="page-subtitle">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} total
            {activeSessions.length > 0 && (
              <span className="badge badge-green" style={{ marginLeft: 'var(--space-2)' }}>
                {activeSessions.length} active
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleArchive}
            disabled={archiving}
          >
            <Archive size={14} />
            {course.isArchived ? 'Unarchive' : 'Archive'}
          </button>
          <Link href={`/lecturer/sessions/new?courseId=${courseId}`} className="btn btn-primary btn-sm">
            <Plus size={14} />
            Start Session
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button
          className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <List size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Sessions
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Analytics
        </button>
      </div>

      {/* Sessions tab */}
      {activeTab === 'sessions' && (
        sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Clock size={48} /></div>
            <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              No sessions yet
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)' }}>
              Start a session to begin taking attendance
            </p>
            <Link href={`/lecturer/sessions/new?courseId=${courseId}`} className="btn btn-primary btn-sm">
              <Plus size={14} />
              Start Session
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Attendees</th>
                  <th>Duration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Analytics tab */}
      {activeTab === 'analytics' && (
        <AnalyticsTab courseId={courseId} />
      )}
    </>
  );
}
