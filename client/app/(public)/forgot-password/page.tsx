'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
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
          <h2 className={styles.panelHeading}>Locked out?</h2>
          <p className={styles.panelSubtitle}>
            Enter your email and we will send you a link to reset your password.
          </p>
        </div>
        <span className={styles.panelFooter}>One scan. Attendance done.</span>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formInner}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>

          {sent ? (
            <div>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Check your email</h1>
                <p className={styles.formSubtitle}>
                  If an account exists for <strong>{email}</strong>, a password
                  reset link has been sent. Check your inbox and spam folder.
                </p>
              </div>
              <Link href="/login" className="btn btn-primary w-full">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Forgot password?</h1>
                <p className={styles.formSubtitle}>
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                {error && (
                  <div className={styles.formError} role="alert">{error}</div>
                )}

                <div className="input-group">
                  <label htmlFor="email" className="input-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="you@uni.edu.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formSubmit}>
                  <button
                    type="submit"
                    className={`btn btn-primary w-full${loading ? ' btn-loading' : ''}`}
                    disabled={loading || !email}
                  >
                    {loading ? '' : 'Send reset link'}
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
