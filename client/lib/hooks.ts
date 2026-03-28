import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from './api';

// ── Generic fetch hook ────────────────────────────────────────
export function useFetch<T>(endpoint: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!endpoint);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(endpoint);
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ── Courses ───────────────────────────────────────────────────
export type Course = {
  id: string;
  lecturerId: string;
  courseCode: string;
  courseTitle: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { sessions: number };
};

export function useCourses() {
  const { data, loading, error, refetch } = useFetch<{ courses: Course[] }>('/api/courses');
  return {
    courses: data?.courses ?? [],
    loading,
    error,
    refetch,
  };
}

export function useCourse(id: string | null) {
  const { data, loading, error, refetch } = useFetch<{
    course: Course;
    sessions: Session[];
  }>(id ? `/api/courses/${id}` : null);
  return { course: data?.course ?? null, sessions: data?.sessions ?? [], loading, error, refetch };
}

// ── Sessions ──────────────────────────────────────────────────
export type Session = {
  id: string;
  courseId: string;
  lecturerId: string;
  latitude: number;
  longitude: number;
  geofenceRadiusM: number;
  timeLimitMinutes: number;
  level: number | null;
  qrPayload: string;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  expiresAt: string;
  closedAt: string | null;
  qrCodeImage?: string;
  attendUrl?: string;
  _count?: { attendances: number };
  course?: Course;
};

export function useSession(id: string | null) {
  const { data, loading, error, refetch } = useFetch<{
    session: Session;
    qrCodeImage: string;
    attendUrl: string;
    attendees: Attendee[];
  }>(id ? `/api/sessions/${id}` : null);
  return {
    session: data?.session ?? null,
    qrCodeImage: data?.qrCodeImage ?? null,
    attendUrl: data?.attendUrl ?? null,
    attendees: data?.attendees ?? [],
    loading,
    error,
    refetch,
  };
}

// ── Attendance ────────────────────────────────────────────────
export type Attendee = {
  id: string;
  fullName: string;
  matricNumber: string | null;
  department: string | null;
  signedAt: string;
  distanceM: number;
  markedManually?: boolean;
};

export type AttendanceRecord = {
  id: string;
  fullName: string;
  matricNumber: string | null;
  department: string | null;
  gender: string | null;
  attended: number;
  total: number;
  percentage: number;
};

export function useCourseAttendance(courseId: string | null) {
  const { data, loading, error, refetch } = useFetch<{
    course: Course;
    sessions: { id: string; createdAt: string; status: string; attendeeCount: number }[];
    records: AttendanceRecord[];
    stats: { totalSessions: number; totalStudents: number };
  }>(courseId ? `/api/attendance/course/${courseId}` : null);
  return {
    course: data?.course ?? null,
    sessions: data?.sessions ?? [],
    records: data?.records ?? [],
    stats: data?.stats ?? { totalSessions: 0, totalStudents: 0 },
    loading,
    error,
    refetch,
  };
}

// ── Student attendance history ────────────────────────────────
export type HistoryItem = {
  id: string;
  signedAt: string;
  session: {
    id: string;
    createdAt: string;
    course: { courseCode: string; courseTitle: string };
  };
};

export function useAttendanceHistory(courseId?: string) {
  const endpoint = courseId
    ? `/api/attendance/history?courseId=${courseId}`
    : '/api/attendance/history';
  const { data, loading, error, refetch } = useFetch<{ history: HistoryItem[] }>(endpoint);
  return { history: data?.history ?? [], loading, error, refetch };
}

// ── Enrollment ────────────────────────────────────────────────
export type EnrollmentEntry = {
  id: string;
  matricNumber: string;
  studentName: string | null;
};

export function useEnrollment(courseId: string | null) {
  const { data, loading, error, refetch } = useFetch<{
    enrollments: EnrollmentEntry[];
    total: number;
  }>(courseId ? `/api/courses/${courseId}/enrollment` : null);
  return {
    enrollments: data?.enrollments ?? [],
    total: data?.total ?? 0,
    loading,
    error,
    refetch,
  };
}
