'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { setStoredAuth, getDashboardPath, User } from '@/lib/auth';
import styles from '../auth.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/api/auth/login',
        { identifier, password }
      );

      setStoredAuth(data.user, data.accessToken, data.refreshToken);

      const destination = returnTo || getDashboardPath(data.user.role);
      router.push(destination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Left branding panel */}
      <aside className={styles.panel}>
        <span className={styles.panelLogo}>Attendly</span>
        <div className={styles.panelContent}>
          <h2 className={styles.panelHeading}>
            Welcome back
          </h2>
          <p className={styles.panelSubtitle}>
            Manage your courses, run sessions, and track records.
          </p>
          <div className={styles.panelSteps}>
            {[
              'Lecturers: start sessions and view live attendance',
              'Students: sign in and track your attendance history',
            ].map((text) => (
              <div key={text} className={styles.panelStep}>
                <div className={styles.panelStepDot} />
                <span className={styles.panelStepText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <span className={styles.panelFooter}>One scan. Attendance done.</span>
      </aside>

      {/* Right form panel */}
      <main className={styles.formPanel}>
        <div className={styles.formInner}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Sign in</h1>
            <p className={styles.formSubtitle}>
              No account?{' '}
              <Link href="/register/lecturer">Register as Lecturer</Link>
              {' '}or{' '}
              <Link href="/register/student">as Student</Link>
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
              <div className={styles.formError} role="alert">{error}</div>
            )}

            <div className="input-group">
              <label htmlFor="identifier" className="input-label">
                Email or Matric Number
              </label>
              <input
                id="identifier"
                type="text"
                className="input"
                placeholder="e.g. you@uni.edu.ng or 2019/1234"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <div className={styles.inputWithToggle}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.toggleBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '4px' }}>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div className={styles.formSubmit}>
              <button
                type="submit"
                className={`btn btn-primary w-full${loading ? ' btn-loading' : ''}`}
                disabled={loading || !identifier || !password}
              >
                {loading ? '' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
