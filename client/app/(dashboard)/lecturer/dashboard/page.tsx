'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BookOpen, Archive, MoreVertical, ChevronRight } from 'lucide-react';
import { useCourses, Course } from '@/lib/hooks';
import { api, ApiError } from '@/lib/api';
import styles from './dashboard.module.css';

// ── Create Course Modal ───────────────────────────────────────
function CreateCourseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/courses', { courseCode, courseTitle });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create course');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            Create Course
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="input-group">
              <label className="input-label">
                Course code <span className="required">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. CSC 401"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                autoFocus
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                Course title <span className="required">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Software Engineering"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary${loading ? ' btn-loading' : ''}`}
              disabled={loading || !courseCode || !courseTitle}
            >
              {loading ? '' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Course Modal ─────────────────────────────────────────
function EditCourseModal({
  course,
  onClose,
  onUpdated,
}: {
  course: Course;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [courseCode, setCourseCode] = useState(course.courseCode);
  const [courseTitle, setCourseTitle] = useState(course.courseTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put(`/api/courses/${course.id}`, { courseCode, courseTitle });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update course');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            Edit Course
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="input-group">
              <label className="input-label">Course code</label>
              <input
                type="text"
                className="input"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                autoFocus
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Course title</label>
              <input
                type="text"
                className="input"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary${loading ? ' btn-loading' : ''}`}
              disabled={loading || !courseCode || !courseTitle}
            >
              {loading ? '' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Course Card ───────────────────────────────────────────────
function CourseCard({
  course,
  onEdit,
  onArchive,
}: {
  course: Course;
  onEdit: (c: Course) => void;
  onArchive: (c: Course) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sessionCount = course._count?.sessions ?? 0;

  return (
    <div className={`${styles.courseCard} ${course.isArchived ? styles.courseCardArchived : ''}`}>
      <div className={styles.courseCardTop}>
        <div className={styles.courseCodeBadge}>
          <span>{course.courseCode}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Course options"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                onClick={() => setMenuOpen(false)}
              />
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => { setMenuOpen(false); onEdit(course); }}
                >
                  Edit
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => { setMenuOpen(false); onArchive(course); }}
                >
                  {course.isArchived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.courseCardBody}>
        <h3 className={styles.courseTitle}>{course.courseTitle}</h3>
        <div className={styles.courseMeta}>
          <span className={styles.courseMetaItem}>
            <BookOpen size={13} />
            {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
          </span>
          {course.isArchived && (
            <span className="badge badge-gray">
              <Archive size={10} />
              Archived
            </span>
          )}
        </div>
      </div>

      <Link href={`/lecturer/courses/${course.id}`} className={styles.courseCardLink}>
        <span>View course</span>
        <ChevronRight size={15} />
      </Link>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function LecturerDashboardPage() {
  const router = useRouter();
  const { courses, loading, error, refetch } = useCourses();
  const [showCreate, setShowCreate] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [incomingSession, setIncomingSession] = useState<{ courseCode: string; courseTitle: string } | null>(null);
  const streamRef = useRef<EventSource | null>(null);

  const activeCourses = courses.filter((c) => !c.isArchived);
  const archivedCourses = courses.filter((c) => c.isArchived);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const stream = new EventSource(`${apiUrl}/api/users/session-stream?token=${token}`);
    streamRef.current = stream;

    stream.onmessage = (event) => {
      try {
        const session = JSON.parse(event.data) as { id: string; courseCode: string; courseTitle: string };
        setIncomingSession({ courseCode: session.courseCode, courseTitle: session.courseTitle });
        router.push(`/lecturer/sessions/${session.id}`);
      } catch {
        // Ignore malformed events.
      }
    };

    return () => {
      stream.close();
      streamRef.current = null;
    };
  }, [router]);

  async function handleArchive(course: Course) {
    setArchiving(course.id);
    try {
      await api.patch(`/api/courses/${course.id}/archive`);
      refetch();
    } catch {
      // silently fail — user sees no change
    } finally {
      setArchiving(null);
    }
  }

  return (
    <>
      <div className={styles.phoneFirstBanner}>
        <div className={styles.phoneFirstBannerCopy}>
          <div className={styles.phoneFirstKicker}>Phone-first session creation</div>
          <h2 className={styles.phoneFirstTitle}>Create on your phone. Keep this tab open on your PC.</h2>
          <p className={styles.phoneFirstText}>
            Phone GPS is usually more accurate. When you create a session from your phone,
            this dashboard will jump straight into the live session on your desktop.
          </p>
        </div>
        <div className={styles.phoneFirstBullets}>
          <span>Better location lock</span>
          <span>Fewer timeout failures</span>
          <span>PC auto-opens the live tab</span>
        </div>
      </div>

      {incomingSession && (
        <div className="card" style={{ marginBottom: 'var(--space-5)', borderColor: 'var(--color-primary)' }}>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)' }}>
                Session opened from your phone
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                {incomingSession.courseCode}: {incomingSession.courseTitle}
              </div>
            </div>
            <div className="spinner" />
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${activeCourses.length} active course${activeCourses.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Course
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={48} />
          </div>
          <p style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            No courses yet
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)' }}>
            Create your first course to start taking attendance
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            Create Course
          </button>
        </div>
      ) : (
        <>
          {/* Active courses */}
          <div className={styles.courseGrid}>
            {activeCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={setEditCourse}
                onArchive={handleArchive}
              />
            ))}
          </div>

          {/* Archived courses */}
          {archivedCourses.length > 0 && (
            <div style={{ marginTop: 'var(--space-10)' }}>
              <h2 style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 'var(--space-4)',
              }}>
                Archived
              </h2>
              <div className={styles.courseGrid}>
                {archivedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEdit={setEditCourse}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* FAB — quick create on mobile */}
      <button
        className="fab"
        onClick={() => setShowCreate(true)}
        aria-label="Create course"
        style={{ display: 'none' }} // shown via CSS on mobile
      >
        <Plus size={24} />
      </button>

      {/* Modals */}
      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreated={refetch}
        />
      )}
      {editCourse && (
        <EditCourseModal
          course={editCourse}
          onClose={() => setEditCourse(null)}
          onUpdated={refetch}
        />
      )}
    </>
  );
}
