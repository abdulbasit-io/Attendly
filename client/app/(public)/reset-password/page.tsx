'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import styles from '../auth.module.css';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className={styles.page}>
        <aside className={styles.panel}>
          <span className={styles.panelLogo}>Attendly</span>
          <div className={styles.panelContent}>
            <h2 className={styles.panelHeading}>Invalid link</h2>
          </div>
          <span className={styles.panelFooter}>Attendly</span>
        </aside>
        <main className={styles.formPanel}>
          <div className={styles.formInner}>
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>Invalid reset link</h1>
              <p className={styles.formSubtitle}>
                This link is invalid or has expired.{' '}
                <Link href="/forgot-password">Request a new one</Link>.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.panel}>
        <span className={styles.panelLogo}>Attendly</span>
        <div className={styles.panelContent}>
          <h2 className={styles.panelHeading}>Create a new password</h2>
          <p className={styles.panelSubtitle}>
            Choose something strong and memorable. You&apos;ll use this to sign
            in to Attendly.
          </p>
        </div>
        <span className={styles.panelFooter}>One scan. Attendance done.</span>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formInner}>
          {done ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-5)',
                textAlign: 'center',
                padding: 'var(--space-10) 0',
              }}
            >
              <CheckCircle size={48} color="var(--color-success)" />
              <div>
                <h1 className={styles.formTitle}>Password updated</h1>
                <p className={styles.formSubtitle} style={{ marginTop: 'var(--space-2)' }}>
                  Your password has been reset successfully.
                </p>
              </div>
              <Link href="/login" className="btn btn-primary">
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>New password</h1>
                <p className={styles.formSubtitle}>
                  Enter your new password below.
                </p>
              </div>

              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                {error && (
                  <div className={styles.formError} role="alert">{error}</div>
                )}

                <div className="input-group">
                  <label htmlFor="password" className="input-label">
                    New password
                  </label>
                  <div className={styles.inputWithToggle}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      autoFocus
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
                </div>

                <div className="input-group">
                  <label htmlFor="confirmPassword" className="input-label">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className={styles.formSubmit}>
                  <button
                    type="submit"
                    className={`btn btn-primary w-full${loading ? ' btn-loading' : ''}`}
                    disabled={loading || !password || !confirmPassword}
                  >
                    {loading ? '' : 'Reset password'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
