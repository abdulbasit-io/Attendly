'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, Shield, AlertCircle, Loader } from 'lucide-react';
import { useCourse } from '@/lib/hooks';
import { getCurrentPosition, GeoPosition } from '@/lib/geo';
import { api, ApiError } from '@/lib/api';
import styles from './new-session.module.css';

const TIME_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hrs', value: 90 },
];

function NewSessionContent() {
  const params = useSearchParams();
  const router = useRouter();
  const courseId = params.get('courseId') || '';

  const { course, loading: courseLoading } = useCourse(courseId || null);

  const [timeLimit, setTimeLimit] = useState(30);
  const [customTime, setCustomTime] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState(50);
  const [geoState, setGeoState] = useState<'idle' | 'capturing' | 'captured' | 'error'>('idle');
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [geoError, setGeoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const effectiveTime = customTime ? parseInt(customTime, 10) : timeLimit;

  async function captureGPS() {
    setGeoState('capturing');
    setGeoError('');
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
      setGeoState('captured');
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : 'Failed to get location');
      setGeoState('error');
    }
  }

  async function handleCreate() {
    if (!position) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const data = await api.post<{ session: { id: string } }>('/api/sessions', {
        courseId,
        timeLimitMinutes: effectiveTime,
        latitude: position.latitude,
        longitude: position.longitude,
        geofenceRadiusM: geofenceRadius,
      });
      router.push(`/lecturer/sessions/${data.session.id}`);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to create session');
      setSubmitting(false);
    }
  }

  if (!courseId) {
    return (
      <div className="alert alert-error">
        No course selected.{' '}
        <Link href="/lecturer/dashboard">Go back to dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ marginBottom: 'var(--space-5)' }}>
        <Link href="/lecturer/dashboard" className="breadcrumb-item">Courses</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href={`/lecturer/courses/${courseId}`} className="breadcrumb-item">
          {courseLoading ? '...' : course?.courseCode ?? 'Course'}
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">New Session</span>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Start Session</h1>
          <p className="page-subtitle">
            {course ? `${course.courseCode} — ${course.courseTitle}` : 'Configure your attendance session'}
          </p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Step 1 — Time limit */}
        <div className="card">
          <div className="card-header">
            <div className={styles.stepHeader}>
              <div className={styles.stepNum}>1</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Clock size={16} color="var(--color-text-secondary)" />
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Session Duration</span>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className={styles.presets}>
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.value}
                  className={`${styles.preset} ${timeLimit === p.value && !customTime ? styles.presetActive : ''}`}
                  onClick={() => { setTimeLimit(p.value); setCustomTime(''); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="input-group">
              <label className="input-label">Or enter a custom duration (minutes)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 20"
                min={1}
                max={180}
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                style={{ maxWidth: 160 }}
              />
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Session will auto-close after{' '}
              <strong>{effectiveTime} {effectiveTime === 1 ? 'minute' : 'minutes'}</strong>.
            </p>
          </div>
        </div>

        {/* Step 2 — GPS */}
        <div className="card">
          <div className="card-header">
            <div className={styles.stepHeader}>
              <div className={styles.stepNum}>2</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <MapPin size={16} color="var(--color-text-secondary)" />
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Capture Your Location</span>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Your GPS coordinates define the classroom centre. Students must be within the
              geofence radius to sign in.
            </p>

            {geoState === 'idle' && (
              <button className="btn btn-secondary" onClick={captureGPS}>
                <MapPin size={15} />
                Capture My Location
              </button>
            )}

            {geoState === 'capturing' && (
              <div className={styles.geoCapturing}>
                <Loader size={18} className={styles.spin} />
                <span>Getting your GPS location…</span>
              </div>
            )}

            {geoState === 'captured' && position && (
              <div className={styles.geoCaptured}>
                <div className={styles.geoCapturedBadge}>
                  <MapPin size={14} />
                  Location captured
                </div>
                <div className={styles.geoCoords}>
                  <span>{position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}</span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                    ±{Math.round(position.accuracy)}m accuracy
                  </span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={captureGPS}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Re-capture
                </button>
              </div>
            )}

            {geoState === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="alert alert-error">
                  <AlertCircle size={15} />
                  {geoError}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={captureGPS}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step 3 — Geofence */}
        <div className="card">
          <div className="card-header">
            <div className={styles.stepHeader}>
              <div className={styles.stepNum}>3</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Shield size={16} color="var(--color-text-secondary)" />
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Geofence Radius</span>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className={styles.geofenceSlider}>
              <input
                type="range"
                min={20}
                max={200}
                step={10}
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles.geofenceValue}>
                <span className={styles.geofenceNum}>{geofenceRadius}m</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  {geofenceRadius <= 30 ? 'Tight (single room)' : geofenceRadius <= 70 ? 'Standard (classroom)' : geofenceRadius <= 120 ? 'Wide (lecture hall)' : 'Very wide (building)'}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Students more than <strong>{geofenceRadius}m</strong> from your location will be rejected.
            </p>
          </div>
        </div>

        {/* Create button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {submitError && (
            <div className="alert alert-error">
              <AlertCircle size={15} />
              {submitError}
            </div>
          )}
          <button
            className={`btn btn-primary btn-lg w-full${submitting ? ' btn-loading' : ''}`}
            onClick={handleCreate}
            disabled={submitting || geoState !== 'captured' || !effectiveTime || effectiveTime < 1}
          >
            {submitting ? '' : 'Create Session & Generate QR'}
          </button>
          {geoState !== 'captured' && (
            <p style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
              Capture your location first to enable session creation
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense>
      <NewSessionContent />
    </Suspense>
  );
}
