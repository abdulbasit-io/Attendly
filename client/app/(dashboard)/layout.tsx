'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  History,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { getStoredUser, clearStoredAuth, UserRole } from '@/lib/auth';
import styles from './dashboard.module.css';

const LECTURER_NAV = [
  { href: '/lecturer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lecturer/profile', label: 'Profile', icon: User },
];

const STUDENT_NAV = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/history', label: 'Attendance History', icon: History },
  { href: '/student/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }
    // Role-based route guard
    const isLecturerRoute = pathname.startsWith('/lecturer/');
    const isStudentRoute = pathname.startsWith('/student/');
    if (isLecturerRoute && stored.role !== 'LECTURER') {
      router.replace('/student/dashboard');
      return;
    }
    if (isStudentRoute && stored.role !== 'STUDENT') {
      router.replace('/lecturer/dashboard');
      return;
    }
    setUser(stored);
  }, [pathname, router]);

  useEffect(() => {
    if (!user || user.role !== 'LECTURER') return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const stream = new EventSource(`${apiUrl}/api/users/session-stream?token=${token}`);

    stream.onmessage = (event) => {
      try {
        const session = JSON.parse(event.data) as { id: string };
        if (!session?.id) return;
        if (pathname !== `/lecturer/sessions/${session.id}`) {
          router.push(`/lecturer/sessions/${session.id}`);
        }
      } catch {
        // Ignore malformed events.
      }
    };

    return () => {
      stream.close();
    };
  }, [user, pathname, router]);

  function handleLogout() {
    clearStoredAuth();
    router.push('/login');
  }

  if (!user) return null;

  const navItems = user.role === 'LECTURER' ? LECTURER_NAV : STUDENT_NAV;

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className={styles.shell}>
      {/* ── Mobile topbar ───────────────────────────────── */}
      <header className={styles.topbar}>
        <button
          className={styles.menuBtn}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className={styles.topbarLogo}>Attendly</Link>
        <Link href={user.role === 'LECTURER' ? '/lecturer/profile' : '/student/profile'}>
          <div className="avatar avatar-sm">{initials}</div>
        </Link>
      </header>

      {/* ── Sidebar overlay (mobile) ─────────────────────── */}
      {sidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href={user.role === 'LECTURER' ? '/lecturer/dashboard' : '/student/dashboard'}>
            <Link href="/" className={styles.sidebarLogo}>Attendly</Link>
          </Link>
          <button
            className={`${styles.menuBtn} ${styles.closeSidebarBtn}`}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className={styles.sidebarUser}>
          <div className="avatar avatar-md">{initials}</div>
          <div className={styles.sidebarUserInfo}>
            <span className={styles.sidebarUserName}>{user.fullName}</span>
            <span className={styles.sidebarUserRole}>
              {user.role === 'LECTURER' ? 'Lecturer' : 'Student'}
              {user.matricNumber ? ` · ${user.matricNumber}` : ''}
            </span>
          </div>
        </div>

        <hr className="divider" style={{ margin: '0 var(--space-4)' }} />

        {/* Nav */}
        <nav className={styles.sidebarNav}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.mainInner}>
          {children}
        </div>
      </main>
    </div>
  );
}
