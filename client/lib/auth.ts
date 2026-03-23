export type UserRole = 'LECTURER' | 'STUDENT';

export type User = {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  department?: string;
  matricNumber?: string;
  gender?: 'MALE' | 'FEMALE';
  createdAt: string;
};

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(user: User, accessToken: string, refreshToken: string) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearStoredAuth() {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}

export function getDashboardPath(role: UserRole): string {
  return role === 'LECTURER' ? '/lecturer/dashboard' : '/student/dashboard';
}
