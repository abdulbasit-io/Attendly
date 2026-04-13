'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Archive,
  BarChart2,
  List,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Download,
  UserCheck,
  Upload,
  Trash2,
} from 'lucide-react';
import { useCourse, useCourseAttendance, useEnrollment, Session, AttendanceRecord, EnrollmentEntry } from '@/lib/hooks';
import { api } from '@/lib/api';
import styles from './course.module.css';

// ── Tab type ──────────────────────────────────────────────────
type Tab = 'sessions' | 'analytics' | 'enrollment';

// ── Session row ───────────────────────────────────────────────
function SessionRow({ session, onDelete }: {
  session: Session & { _count?: { attendances: number } };
  onDelete: (id: string) => void;
}) {
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
        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
          <Link
            href={`/lecturer/sessions/${session.id}`}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            View
          </Link>
          {!isActive && (
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => onDelete(session.id)}
              aria-label="Delete session"
              style={{ color: 'var(--color-error)' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Enrollment tab ────────────────────────────────────────────
function EnrollmentTab({ courseId }: { courseId: string }) {
  const { enrollments, total, loading, error, refetch } = useEnrollment(courseId);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  function parseCSV(text: string): { matricNumber: string; studentName: string }[] {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const students: { matricNumber: string; studentName: string }[] = [];
    for (const line of lines) {
      if (line.toLowerCase().startsWith('matric')) continue; // skip header
      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      const matricNumber = parts[0];
      const studentName = parts[1] || '';
      if (matricNumber) students.push({ matricNumber, studentName });
    }
    return students;
  }

  async function handleImport() {
    setImportError('');
    setImportSuccess('');
    const students = parseCSV(csvText);
    if (students.length === 0) {
      setImportError('No valid matric numbers found. Each line should start with a matric number.');
      return;
    }
    setImporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/courses/${courseId}/enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ students }),
      });
      const data = await res.json();
      if (!res.ok) { setImportError(data.error || 'Import failed'); return; }
      setImportSuccess(`Imported ${data.imported} student${data.imported !== 1 ? 's' : ''}. Total enrolled: ${data.total}.`);
      setCsvText('');
      refetch();
    } catch {
      setImportError('Network error. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  async function handleClear() {
    if (!confirm('Remove all enrolled students from this course? Attendance signing restrictions will be lifted.')) return;
    setClearing(true);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/api/courses/${courseId}/enrollment`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      refetch();
    } catch { /* ignore */ } finally {
      setClearing(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string ?? '');
    reader.readAsText(file);
    e.target.value = '';
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><div className="spinner spinner-lg" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Status banner */}
      <div className={`alert ${total > 0 ? 'alert-info' : ''}`} style={{
        background: total > 0 ? 'var(--color-primary-light)' : 'var(--color-surface)',
        border: `1px solid ${total > 0 ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      }}>
        <UserCheck size={18} color={total > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
        <div style={{ flex: 1 }}>
          {total > 0 ? (
            <>
              <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)' }}>
                Enrollment active — {total} student{total !== 1 ? 's' : ''} enrolled.
              </span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginLeft: 'var(--space-2)' }}>
                Only these matric numbers can sign attendance.
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--color-text-secondary)' }}>
              No enrollment list — any registered student can sign attendance.
            </span>
          )}
        </div>
        {total > 0 && (
          <button
            className={`btn btn-ghost btn-sm${clearing ? ' btn-loading' : ''}`}
            onClick={handleClear}
            disabled={clearing}
            style={{ color: 'var(--color-error)' }}
          >
            {clearing ? '' : <><Trash2 size={13} /> Clear All</>}
          </button>
        )}
      </div>

      {/* Import form */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>
            Import Students
          </span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Paste CSV data or upload a file. Format: <code style={{ background: 'var(--color-surface)', padding: '1px 6px', borderRadius: 4 }}>MatricNumber,Name</code> (one per line, Name is optional). Existing entries are updated, not duplicated.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={13} />
              Upload CSV
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>or paste below</span>
          </div>
          <textarea
            className="input"
            style={{ minHeight: 140, fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', resize: 'vertical' }}
            placeholder={'2021/1234,John Doe\n2021/5678,Jane Doe\n2021/9012'}
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); setImportError(''); setImportSuccess(''); }}
          />
          {importError && <div className="alert alert-error" style={{ fontSize: 'var(--font-size-sm)' }}>{importError}</div>}
          {importSuccess && <div className="alert alert-success" style={{ fontSize: 'var(--font-size-sm)' }}>{importSuccess}</div>}
          <button
            className={`btn btn-primary btn-sm${importing ? ' btn-loading' : ''}`}
            onClick={handleImport}
            disabled={importing || !csvText.trim()}
            style={{ alignSelf: 'flex-start' }}
          >
            {importing ? '' : 'Import'}
          </button>
        </div>
      </div>

      {/* Enrolled list */}
      {enrollments.length > 0 && (
        <div>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)' }}>
            Enrolled Students ({total})
          </h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Matric Number</th>
                  <th>Name (from roster)</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e: EnrollmentEntry) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>{e.matricNumber}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{e.studentName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
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
  const [showPhoneTip, setShowPhoneTip] = useState(true);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem('attendly_phone_tip_dismissed') === '1';
    if (dismissed) {
      setShowPhoneTip(false);
    }
  }, []);

  function dismissPhoneTip() {
    setShowPhoneTip(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendly_phone_tip_dismissed', '1');
    }
  }

  function handleOpenStartModal() {
    setShowStartSessionModal(true);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Delete this session and all its attendance records? This cannot be undone.')) return;
    try {
      await api.del(`/api/sessions/${sessionId}`);
      refetch();
    } catch { /* ignore */ }
  }

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
          <button className="btn btn-primary btn-sm" onClick={handleOpenStartModal}>
            <Plus size={14} />
            Start Session
          </button>
        </div>
      </div>

      {showPhoneTip && (
        <div className={styles.phoneTip}>
          <div>
            <div className={styles.phoneTipTitle}>Start sessions on your phone for better GPS accuracy.</div>
            <p className={styles.phoneTipText}>
              Phone location is usually steadier. Keep this tab open and the live session will open here automatically.
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={dismissPhoneTip}>Dismiss</button>
        </div>
      )}

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
        <button
          className={`tab ${activeTab === 'enrollment' ? 'active' : ''}`}
          onClick={() => setActiveTab('enrollment')}
        >
          <UserCheck size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Enrollment
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
            <button className="btn btn-primary btn-sm" onClick={handleOpenStartModal}>
              <Plus size={14} />
              Start Session
            </button>
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
                  <SessionRow key={session.id} session={session} onDelete={handleDeleteSession} />
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

      {/* Enrollment tab */}
      {activeTab === 'enrollment' && (
        <EnrollmentTab courseId={courseId} />
      )}

      {showStartSessionModal && (
        <div className="modal-overlay" onClick={() => setShowStartSessionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                Start on your phone
              </h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowStartSessionModal(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                Phone GPS is usually steadier. The session will still open on this laptop automatically.
              </p>
              <div className={styles.quickReasons}>
                <div className={styles.quickReason}>Laptop GPS can drift.</div>
                <div className={styles.quickReason}>Phone GPS is usually steadier.</div>
                <div className={`${styles.quickReason} ${styles.quickReasonGood}`}>Use your phone, and this tab opens the live session.</div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => setShowStartSessionModal(false)}>
                I&apos;ll Use My Phone
              </button>
              <Link
                href={`/lecturer/sessions/new?courseId=${courseId}`}
                className="btn btn-primary"
                onClick={() => setShowStartSessionModal(false)}
              >
                Continue on Laptop
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
