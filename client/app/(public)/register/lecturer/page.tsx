'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { setStoredAuth, User } from '@/lib/auth';
import styles from '../../auth.module.css';

export default function RegisterLecturerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/api/auth/register',
        {
          role: 'LECTURER',
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        }
      );

      setStoredAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/lecturer/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Left branding panel */}
      <aside className={styles.panel}>
        <Link href="/" className={styles.panelLogo}>Attendly</Link>
        <div className={styles.panelContent}>
          <h2 className={styles.panelHeading}>
            Stop calling names.
          </h2>
          <p className={styles.panelSubtitle}>
            Create a session, share a QR, and watch attendance mark itself. GPS-verified.
          </p>
          <div className={styles.panelSteps}>
            {[
              'Create courses and manage sessions',
              'Share QR codes via WhatsApp in one tap',
              'Watch students sign in live',
              'Export records to CSV',
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
            <h1 className={styles.formTitle}>Create your account</h1>
            <p className={styles.formSubtitle}>
              Registering as a <strong>Lecturer</strong>.{' '}
              <Link href="/register/student">Register as Student instead</Link>
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
              <div className={styles.formError} role="alert">{error}</div>
            )}

            <div className="input-group">
              <label htmlFor="fullName" className="input-label">
                Full name <span className="required">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                className={`input${fieldErrors.fullName ? ' input-error' : ''}`}
                placeholder="e.g. Dr. Amina Bello"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                autoComplete="name"
                autoFocus
              />
              {fieldErrors.fullName && (
                <span className="input-error-msg">{fieldErrors.fullName}</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label">
                University email <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`input${fieldErrors.email ? ' input-error' : ''}`}
                placeholder="you@unilag.edu.ng"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="input-error-msg">{fieldErrors.email}</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Password <span className="required">*</span>
              </label>
              <div className={styles.inputWithToggle}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input${fieldErrors.password ? ' input-error' : ''}`}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  autoComplete="new-password"
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
              {fieldErrors.password && (
                <span className="input-error-msg">{fieldErrors.password}</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">
                Confirm password <span className="required">*</span>
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className={`input${fieldErrors.confirmPassword ? ' input-error' : ''}`}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword && (
                <span className="input-error-msg">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            <div className={styles.formSubmit}>
              <button
                type="submit"
                className={`btn btn-primary w-full${loading ? ' btn-loading' : ''}`}
                disabled={loading}
              >
                {loading ? '' : 'Create account'}
              </button>
            </div>
          </form>

          <div className={styles.formFooter}>
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
