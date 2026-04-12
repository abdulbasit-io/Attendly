'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, CheckCircle, XCircle, AlertCircle, Loader, Clock } from 'lucide-react';
import { getStoredUser } from '@/lib/auth';
import { getCurrentPosition, GeoPosition } from '@/lib/geo';
import { api, ApiError } from '@/lib/api';
import { getDeviceId, getDeviceFingerprint } from '@/lib/device';
import styles from './attend.module.css';

// ── Types ─────────────────────────────────────────────────────
type SessionInfo = {
  courseTitle: string;
  courseCode: string;
  lecturerName: string;
  status: 'ACTIVE' | 'CLOSED';
  expiresAt: string;
  geofenceRadiusM: number;
};

type FlowState =
  | 'checking-auth'
  | 'loading-session'
  | 'session-error'
  | 'capturing-gps'
  | 'gps-error'
  | 'confirm'
  | 'submitting'
  | 'success'
  | 'already-signed'
  | 'error';

// ── Wrapper card ──────────────────────────────────────────────
function AttendCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/" className={styles.logo}>Attendly</Link>
      </div>
      <div className={styles.card}>
        {children}
      </div>
    </div>
  );
}

// ── Main flow ─────────────────────────────────────────────────
export default function AttendPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const user = getStoredUser();
  const [flowState, setFlowState] = useState<FlowState>('checking-auth');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1 — auth check
  useEffect(() => {
    if (!user) {
      router.replace(`/login?returnTo=/attend/${sessionId}`);
      return;
    }
    if (user.role !== 'STUDENT') {
      setFlowState('error');
      setErrorMsg('Only students can sign attendance. Please sign in with a student account.');
      return;
    }
    setFlowState('loading-session');
  }, []);

  // Step 2 — load session info
  useEffect(() => {
    if (flowState !== 'loading-session') return;
    (async () => {
      try {
        const data = await api.get<SessionInfo>(`/api/sessions/${sessionId}/info`);
        if (data.status === 'CLOSED' || new Date(data.expiresAt) < new Date()) {
          setFlowState('session-error');
          setErrorMsg('This session has expired or is no longer active.');
          return;
        }
        setSessionInfo(data);
        setFlowState('capturing-gps');
      } catch (err) {
        setFlowState('session-error');
        setErrorMsg(err instanceof ApiError ? err.message : 'Session not found or invalid link.');
      }
    })();
  }, [flowState]);

  // Step 3 — GPS capture (auto-triggered)
  useEffect(() => {
    if (flowState !== 'capturing-gps') return;
    (async () => {
      try {
        const pos = await getCurrentPosition();
        setPosition(pos);
        setFlowState('confirm');
      } catch (err) {
        setFlowState('gps-error');
        setErrorMsg(err instanceof Error ? err.message : 'Could not get your location.');
      }
    })();
  }, [flowState]);

  // Step 4 — submit attendance
  async function handleConfirm() {
    if (!position) return;
    setFlowState('submitting');
    try {
      await api.post('/api/attendance', {
        sessionId,
        latitude: position.latitude,
        longitude: position.longitude,
        deviceId: getDeviceId(),
        fingerprint: getDeviceFingerprint(),
      });
      setFlowState('success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setFlowState('already-signed');
          return;
        }
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
      setFlowState('error');
    }
  }

  // ── Render states ─────────────────────────────────────────

  if (flowState === 'checking-auth' || flowState === 'loading-session') {
    return (
      <AttendCard>
        <div className={styles.centred}>
          <div className="spinner spinner-lg" />
          <p className={styles.loadingText}>Loading session…</p>
        </div>
      </AttendCard>
    );
  }

  if (flowState === 'capturing-gps') {
    return (
      <AttendCard>
        <div className={styles.centred}>
          <div className={styles.gpsIcon}>
            <MapPin size={32} color="var(--color-primary)" />
          </div>
          <h2 className={styles.stateTitle}>Getting your location</h2>
          <p className={styles.stateSubtitle}>
            Allow location access when prompted. This confirms you are physically in class.
          </p>
          <div className={styles.gpsProgress}>
            <Loader size={18} className={styles.spin} />
            <span>Acquiring GPS signal…</span>
          </div>
        </div>
      </AttendCard>
    );
  }

  if (flowState === 'gps-error') {
    return (
      <AttendCard>
        <div className={styles.centred}>
          <AlertCircle size={40} color="var(--color-error)" />
          <h2 className={styles.stateTitle}>Location access needed</h2>
          <p className={styles.stateSubtitle}>{errorMsg}</p>
          <button className="btn btn-primary" onClick={() => setFlowState('capturing-gps')}>
            <MapPin size={15} />
            Try Again
          </button>
        </div>
      </AttendCard>
    );
  }

  if (flowState === 'session-error') {
    return (
      <AttendCard>
        <div className={styles.centred}>
          <div className={styles.iconCircle} style={{ background: 'var(--color-error-light)' }}>
            <Clock size={28} color="var(--color-error)" />
          </div>
          <h2 className={styles.stateTitle}>Session unavailable</h2>
          <p className={styles.stateSubtitle}>{errorMsg}</p>
          <Link href="/student/dashboard" className="btn btn-ghost btn-sm">
            Back to Dashboard
          </Link>
        </div>
      </AttendCard>
    );
  }

  if (flowState === 'confirm' && sessionInfo && user) {
    const expiresAt = new Date(sessionInfo.expiresAt);
    const minsLeft = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000));

    return (
      <AttendCard>
        <div className={styles.confirmView}>
          {/* Session info */}
          <div className={styles.sessionBadge}>
            <div className={styles.sessionBadgeCode}>{sessionInfo.courseCode}</div>
            <div className={styles.sessionBadgeName}>{sessionInfo.courseTitle}</div>
            <div className={styles.sessionBadgeLecturer}>
              {sessionInfo.lecturerName} · {minsLeft} min left
            </div>
          </div>

          <hr className="divider" />

          {/* GPS data */}
          {position && (
            <div className={styles.gpsSection}>
              <div className={styles.gpsSectionLabel}>
                <MapPin size={14} />
                Location Captured
              </div>
              <div className={styles.gpsDetails}>
                <div className={styles.gpsRow}>
                  <span className={styles.gpsLabel}>Latitude</span>
                  <span className={styles.gpsValue}>{position.latitude.toFixed(6)}</span>
                </div>
                <div className={styles.gpsRow}>
                  <span className={styles.gpsLabel}>Longitude</span>
                  <span className={styles.gpsValue}>{position.longitude.toFixed(6)}</span>
                </div>
                <div className={styles.gpsRow}>
                  <span className={styles.gpsLabel}>Accuracy</span>
                  <span className={styles.gpsValue}>±{Math.round(position.accuracy)}m</span>
                </div>
              </div>
            </div>
          )}

          <hr className="divider" />

          {/* Student info — auto-filled */}
          <div className={styles.studentInfo}>
            <div className={styles.studentInfoLabel}>Signing in as</div>
            <div className={styles.studentInfoName}>{user.fullName}</div>
            {user.matricNumber && (
              <div className={styles.studentInfoMeta}>{user.matricNumber}</div>
            )}
            {user.department && (
              <div className={styles.studentInfoMeta}>{user.department}</div>
            )}
          </div>

          <button
            className="btn btn-primary btn-lg w-full"
            onClick={handleConfirm}
          >
            <CheckCircle size={18} />
            Confirm Attendance
          </button>

          <p className={styles.disclaimer}>
            By confirming, you verify that you are physically present in this class.
          </p>
        </div>
      </AttendCard>
    );
  }

  if (flowState === 'submitting') {
    return (
      <AttendCard>
        <div className={styles.centred}>
          <div className="spinner spinner-lg" />
          <p className={styles.loadingText}>Signing your attendance…</p>
        </div>
      </AttendCard>
    );
  }

  if (flowState === 'success' && sessionInfo && user) {
    return (
      <AttendCard>
        <div className={styles.centred}>
          <div className={styles.iconCircle} style={{ background: 'var(--color-success-light)' }}>
            <CheckCircle size={36} color="var(--color-success)" />
          </div>
          <h2 className={styles.stateTitle}>Attendance Confirmed</h2>
          <div className={styles.successDetails}>
            <div className={styles.successCourse}>{sessionInfo.courseCode}: {sessionInfo.courseTitle}</div>
            <div className={styles.successName}>{user.fullName}</div>
            {user.matricNumber && (
              <div className={styles.successMeta}>{user.matricNumber}</div>
            )}
            <div className={styles.successTime}>
              {new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {new Date().toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
          <Link href="/student/dashboard" className="btn btn-ghost btn-sm">
            Back to Dashboard
          </Link>
        </div>
      </AttendCard>
    );
  }

  if (flowState === 'already-signed') {
    return (
      <AttendCard>
        <div className={styles.centred}>
          <div className={styles.iconCircle} style={{ background: 'var(--color-primary-light)' }}>
            <CheckCircle size={32} color="var(--color-primary)" />
          </div>
          <h2 className={styles.stateTitle}>Already signed in</h2>
          <p className={styles.stateSubtitle}>
            You have already signed attendance for this session.
          </p>
          <Link href="/student/dashboard" className="btn btn-ghost btn-sm">
            Back to Dashboard
          </Link>
        </div>
      </AttendCard>
    );
  }

  // Generic error
  return (
    <AttendCard>
      <div className={styles.centred}>
        <div className={styles.iconCircle} style={{ background: 'var(--color-error-light)' }}>
          <XCircle size={32} color="var(--color-error)" />
        </div>
        <h2 className={styles.stateTitle}>Something went wrong</h2>
        <p className={styles.stateSubtitle}>{errorMsg || 'An unexpected error occurred.'}</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setFlowState('capturing-gps')}>
            Try Again
          </button>
          <Link href="/student/dashboard" className="btn btn-ghost btn-sm">
            Dashboard
          </Link>
        </div>
      </div>
    </AttendCard>
  );
}
