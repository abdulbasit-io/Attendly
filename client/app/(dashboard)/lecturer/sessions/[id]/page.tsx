'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Share2, Download, StopCircle, Users, Clock,
  CheckCircle, Wifi, WifiOff, FileDown, MapPin, Timer, Copy, Check,
  UserPlus, Search, Pencil,
} from 'lucide-react';
import { useSession, Attendee } from '@/lib/hooks';
import { api, ApiError } from '@/lib/api';
import styles from './session.module.css';

// ── Countdown timer ───────────────────────────────────────────
function useCountdown(expiresAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  return { secondsLeft, display: `${mins}:${secs}` };
}

// ── SSE hook ──────────────────────────────────────────────────
function useSSEAttendees(sessionId: string, initialAttendees: Attendee[], isActive: boolean) {
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // Sync initial attendees when they load
  useEffect(() => {
    if (initialAttendees.length > 0) {
      setAttendees(initialAttendees);
    }
  }, [initialAttendees]);

  useEffect(() => {
    if (!isActive || !sessionId) return;

    const token = localStorage.getItem('accessToken');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const url = `${API_URL}/api/sessions/${sessionId}/stream`;

    // SSE doesn't support custom headers natively — pass token as query param
    const es = new EventSource(`${url}?token=${token}`);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const attendee: Attendee = JSON.parse(event.data);
        setAttendees((prev) => {
          if (prev.find((a) => a.id === attendee.id)) return prev;
          return [attendee, ...prev];
        });
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [sessionId, isActive]);

  function addAttendee(a: Attendee) {
    setAttendees((prev) => {
      if (prev.find((x) => x.id === a.id)) return prev;
      return [a, ...prev];
    });
  }

  return { attendees, connected, addAttendee };
}

// ── QR share helpers ──────────────────────────────────────────
function shareToWhatsApp(attendUrl: string, courseTitle: string) {
  const text = encodeURIComponent(
    `Attendance is open for ${courseTitle}!\nTap to sign in: ${attendUrl}`
  );
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function downloadQR(imageBase64: string, courseCode: string) {
  const link = document.createElement('a');
  link.href = imageBase64;
  link.download = `attendance-qr-${courseCode}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── Client-side CSV export ────────────────────────────────────
function exportSessionCSV(attendees: Attendee[], courseCode: string, sessionDate: string) {
  const header = 'Name,Matric Number,Department,Time Signed In,Distance (m)\n';
  const rows = attendees.map((a) => {
    const time = new Date(a.signedAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `"${a.fullName}","${a.matricNumber || ''}","${a.department || ''}","${time}",${Math.round(Number(a.distanceM))}`;
  });
  const csv = header + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `attendance-${courseCode}-${sessionDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ── Session summary card (shown for closed sessions) ──────────
function SessionSummaryCard({ session, attendeeCount }: {
  session: { createdAt: string; closedAt?: string | null; expiresAt: string; timeLimitMinutes: number; geofenceRadiusM: number; level: number | null };
  attendeeCount: number;
}) {
  const opened = new Date(session.createdAt);
  const closed = session.closedAt ? new Date(session.closedAt) : new Date(session.expiresAt);
  const durationMs = closed.getTime() - opened.getTime();
  const durationMins = Math.round(durationMs / 60000);

  const fmt = (d: Date) => d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="card">
      <div className="card-header" style={{ paddingBottom: 'var(--space-3)' }}>
        <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>
          Session Summary
        </span>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Clock size={13} /> Opened
          </span>
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{fmt(opened)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Clock size={13} /> Closed
          </span>
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{fmt(closed)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Timer size={13} /> Duration
          </span>
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{durationMins} min</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <MapPin size={13} /> Geofence
          </span>
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{session.geofenceRadiusM}m radius</span>
        </div>
        {session.level && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Users size={13} /> Level
            </span>
            <span className="badge badge-blue" style={{ fontSize: 'var(--font-size-xs)' }}>{session.level}L</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Users size={13} /> Attendees
          </span>
          <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)' }}>{attendeeCount}</span>
        </div>
      </div>
    </div>
  );
}

// ── Attendee row ──────────────────────────────────────────────
function AttendeeRow({ attendee, index }: { attendee: Attendee; index: number }) {
  const initials = attendee.fullName
    .split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  const time = new Date(attendee.signedAt).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <tr className={styles.attendeeRow} style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="avatar avatar-sm">{initials}</div>
          <div>
            <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
              {attendee.fullName}
            </div>
            {attendee.department && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                {attendee.department}
              </div>
            )}
          </div>
        </div>
      </td>
      <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        {attendee.matricNumber || '—'}
      </td>
      <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
        {time}
      </td>
      <td>
        {attendee.markedManually ? (
          <span className="badge badge-amber" style={{ fontSize: 'var(--font-size-xs)' }}>
            <Pencil size={9} /> Manual
          </span>
        ) : (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            {Math.round(Number(attendee.distanceM))}m
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Mark Present modal ────────────────────────────────────────
function MarkPresentModal({ sessionId, onMarked, onCancel }: {
  sessionId: string;
  onMarked: (attendee: Attendee) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; fullName: string; matricNumber: string | null; department: string | null; level: number | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setResults(data.students ?? []);
      } catch { /* ignore */ } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleMark(studentId: string) {
    setMarking(studentId);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/attendance/sessions/${sessionId}/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Failed to mark student');
        return;
      }
      const student = results.find((s) => s.id === studentId)!;
      setSuccessIds((prev) => new Set([...prev, studentId]));
      onMarked({
        id: student.id,
        fullName: student.fullName,
        matricNumber: student.matricNumber,
        department: student.department,
        signedAt: new Date().toISOString(),
        distanceM: 0,
        markedManually: true,
      });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setMarking(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            Mark Student Present
          </h2>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Search by name or matric number for students without phone access.
          </p>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Name or matric number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          {error && <div className="alert alert-error" style={{ fontSize: 'var(--font-size-sm)' }}>{error}</div>}
          {searching && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}>
              <div className="spinner" />
            </div>
          )}
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 280, overflowY: 'auto' }}>
              {results.map((student) => {
                const done = successIds.has(student.id);
                return (
                  <div key={student.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                    background: done ? 'var(--color-success-light)' : 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
                        {student.fullName}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {student.matricNumber || 'No matric'}{student.department ? ` · ${student.department}` : ''}
                      </div>
                    </div>
                    {done ? (
                      <CheckCircle size={18} color="var(--color-success)" />
                    ) : (
                      <button
                        className={`btn btn-primary btn-sm${marking === student.id ? ' btn-loading' : ''}`}
                        disabled={!!marking}
                        onClick={() => handleMark(student.id)}
                      >
                        {marking === student.id ? '' : 'Mark Present'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              No registered students found for "{query}"
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── End session modal ─────────────────────────────────────────
function EndSessionModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            End Session?
          </h2>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            This will close the session immediately. Students will no longer be able to sign in.
            The attendance record will be saved.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`btn btn-danger${loading ? ' btn-loading' : ''}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '' : 'End Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const { session, qrCodeImage, attendUrl, attendees: initialAttendees, loading, error, refetch } = useSession(sessionId);
  const isActive = session?.status === 'ACTIVE';
  const { secondsLeft, display: timerDisplay } = useCountdown(session?.expiresAt ?? null);
  const { attendees, connected, addAttendee } = useSSEAttendees(sessionId, initialAttendees, isActive);

  const [ending, setEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [shareError, setShareError] = useState('');
  const [copied, setCopied] = useState(false);

  const courseTitle = session?.course?.courseTitle ?? 'Course';
  const courseCode = session?.course?.courseCode ?? '';

  // Auto-redirect when session expires
  useEffect(() => {
    if (isActive && secondsLeft === 0 && session) {
      const t = setTimeout(() => refetch(), 2000);
      return () => clearTimeout(t);
    }
  }, [isActive, secondsLeft, session, refetch]);

  async function handleEndSession() {
    setEnding(true);
    try {
      await api.patch(`/api/sessions/${sessionId}/close`);
      setShowEndModal(false);
      await refetch();
    } catch (err) {
      setEnding(false);
    }
  }

  function handleShare() {
    if (!attendUrl) return;
    shareToWhatsApp(attendUrl, courseTitle);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error || !session) {
    return <div className="alert alert-error">{error || 'Session not found'}</div>;
  }

  const timerDanger = secondsLeft < 120 && isActive;
  const totalSecs = (session.timeLimitMinutes ?? 0) * 60;
  const progressPct = totalSecs > 0 ? Math.round((secondsLeft / totalSecs) * 100) : 0;

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ marginBottom: 'var(--space-5)' }}>
        <Link href="/lecturer/dashboard" className="breadcrumb-item">Courses</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href={`/lecturer/courses/${session.courseId}`} className="breadcrumb-item">
          {courseCode}
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Session</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <h1 className="page-title">{courseTitle}</h1>
            <span className={`badge ${isActive ? 'badge-green' : 'badge-gray'}`}>
              {isActive ? <CheckCircle size={10} /> : null}
              {isActive ? 'Live' : 'Closed'}
            </span>
            {session.level && (
              <span className="badge badge-blue">{session.level}L</span>
            )}
          </div>
          <p className="page-subtitle">
            {new Date(session.createdAt).toLocaleDateString('en-NG', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
        </div>
        {isActive && (
          <button className="btn btn-danger-outline btn-sm" onClick={() => setShowEndModal(true)}>
            <StopCircle size={14} />
            End Session
          </button>
        )}
      </div>

      {/* Main two-column layout */}
      <div className={styles.sessionLayout}>
        {/* Left — QR + actions */}
        <div className={styles.qrPanel}>
          {/* Session summary (closed) */}
          {!isActive && (
            <SessionSummaryCard session={session} attendeeCount={attendees.length} />
          )}

          {/* Timer (active) */}
          {isActive && (
            <div className={styles.timerCard}>
              <div className={styles.timerLabel}>
                <Clock size={14} />
                Time remaining
              </div>
              <div className={`${styles.timerDisplay} ${timerDanger ? styles.timerDanger : ''}`}>
                {timerDisplay}
              </div>
              <div className="progress-bar" style={{ marginTop: 'var(--space-3)' }}>
                <div
                  className={`progress-bar-fill ${timerDanger ? 'danger' : ''}`}
                  style={{ width: `${progressPct}%`, transition: 'width 1s linear' }}
                />
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className={`card ${styles.qrCard}`}>
            <div className="card-body" style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {qrCodeImage ? (
                <img
                  src={qrCodeImage}
                  alt="Attendance QR Code"
                  className={`${styles.qrImage} ${!isActive ? styles.qrExpired : ''}`}
                  width={240}
                  height={240}
                />
              ) : (
                <div className={styles.qrPlaceholder}>
                  <div className="spinner" />
                </div>
              )}
              {!isActive && (
                <div className={styles.qrExpiredOverlay}>
                  Session Closed
                </div>
              )}
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                {isActive ? 'Share this QR with your class' : 'This session has ended'}
              </p>
            </div>

            {/* Share actions */}
            {isActive && qrCodeImage && (
              <div className="card-footer" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={handleShare} style={{ flex: 1 }}>
                  <Share2 size={14} />
                  Share to WhatsApp
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    if (!attendUrl) return;
                    navigator.clipboard.writeText(attendUrl).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => downloadQR(qrCodeImage, courseCode)}
                  aria-label="Download QR"
                >
                  <Download size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Attend URL */}
          {attendUrl && (
            <div className={styles.attendUrlCard}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Direct link
              </span>
              <code className={styles.attendUrl}>{attendUrl}</code>
            </div>
          )}
        </div>

        {/* Right — Live attendee list */}
        <div className={styles.attendeePanel}>
          <div className={styles.attendeeHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Users size={16} />
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Attendees</span>
              <span className="badge badge-brand">{attendees.length}</span>
            </div>
            {isActive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowMarkModal(true)}>
                  <UserPlus size={13} />
                  Mark Present
                </button>
                <div className={`${styles.sseIndicator} ${connected ? styles.sseConnected : styles.sseDisconnected}`}>
                  {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {connected ? 'Live' : 'Reconnecting…'}
                </div>
              </div>
            ) : attendees.length > 0 ? (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => exportSessionCSV(
                  attendees,
                  courseCode,
                  new Date(session.createdAt).toISOString().slice(0, 10),
                )}
              >
                <FileDown size={14} />
                Export CSV
              </button>
            ) : null}
          </div>

          {attendees.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <div className="empty-state-icon">
                <Users size={36} />
              </div>
              <p style={{ fontWeight: 'var(--font-weight-medium)' }}>
                {isActive ? 'Waiting for students…' : 'No one signed in'}
              </p>
              {isActive && (
                <p style={{ fontSize: 'var(--font-size-sm)' }}>
                  Students will appear here as they scan the QR code
                </p>
              )}
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Matric</th>
                    <th>Time</th>
                    <th>Dist.</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a, i) => (
                    <AttendeeRow key={a.id} attendee={a} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Mark present modal */}
      {showMarkModal && (
        <MarkPresentModal
          sessionId={sessionId}
          onMarked={(attendee) => addAttendee(attendee)}
          onCancel={() => setShowMarkModal(false)}
        />
      )}

      {/* End session modal */}
      {showEndModal && (
        <EndSessionModal
          onConfirm={handleEndSession}
          onCancel={() => setShowEndModal(false)}
          loading={ending}
        />
      )}
    </>
  );
}
