'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { setStoredAuth, User } from '@/lib/auth';
import styles from '../../auth.module.css';

export default function RegisterStudentPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    department: '',
    matricNumber: '',
    gender: '',
    level: '',
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
    if (!form.department.trim()) errs.department = 'Department is required';
    if (!form.matricNumber.trim()) errs.matricNumber = 'Matric number is required';
    if (!form.gender) errs.gender = 'Gender is required';
    if (!form.level) errs.level = 'Level is required';
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
          role: 'STUDENT',
          fullName: form.fullName,
          email: form.email,
          department: form.department,
          matricNumber: form.matricNumber,
          gender: form.gender,
          level: parseInt(form.level, 10),
          password: form.password,
        }
      );

      setStoredAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/student/dashboard');
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
        <span className={styles.panelLogo}>Attendly</span>
        <div className={styles.panelContent}>
          <h2 className={styles.panelHeading}>
            Sign attendance in seconds.
          </h2>
          <p className={styles.panelSubtitle}>
            Your lecturer shares a QR. You scan, confirm your location, and you're done.
          </p>
          <div className={styles.panelSteps}>
            {[
              'Scan the QR from your WhatsApp group',
              'Your name and matric number are auto-filled',
              'GPS confirms you are in the classroom',
              'One tap. Attendance recorded.',
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
              Registering as a <strong>Student</strong>.{' '}
              <Link href="/register/lecturer">Register as Lecturer instead</Link>
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
                placeholder="e.g. Chukwuemeka Obi"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                autoComplete="name"
                autoFocus
              />
              {fieldErrors.fullName && (
                <span className="input-error-msg">{fieldErrors.fullName}</span>
              )}
            </div>

            <div className={styles.formRow}>
              <div className="input-group">
                <label htmlFor="matricNumber" className="input-label">
                  Matric number <span className="required">*</span>
                </label>
                <input
                  id="matricNumber"
                  type="text"
                  className={`input${fieldErrors.matricNumber ? ' input-error' : ''}`}
                  placeholder="e.g. 2021/1234"
                  value={form.matricNumber}
                  onChange={(e) => set('matricNumber', e.target.value)}
                  autoComplete="off"
                />
                {fieldErrors.matricNumber && (
                  <span className="input-error-msg">{fieldErrors.matricNumber}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="gender" className="input-label">
                  Gender <span className="required">*</span>
                </label>
                <select
                  id="gender"
                  className={`select${fieldErrors.gender ? ' input-error' : ''}`}
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                {fieldErrors.gender && (
                  <span className="input-error-msg">{fieldErrors.gender}</span>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className="input-group">
                <label htmlFor="level" className="input-label">
                  Level <span className="required">*</span>
                </label>
                <select
                  id="level"
                  className={`select${fieldErrors.level ? ' input-error' : ''}`}
                  value={form.level}
                  onChange={(e) => set('level', e.target.value)}
                >
                  <option value="">Select level</option>
                  <option value="100">100L</option>
                  <option value="200">200L</option>
                  <option value="300">300L</option>
                  <option value="400">400L</option>
                  <option value="500">500L</option>
                  <option value="600">600L</option>
                </select>
                {fieldErrors.level && (
                  <span className="input-error-msg">{fieldErrors.level}</span>
                )}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="department" className="input-label">
                Department <span className="required">*</span>
              </label>
              <input
                id="department"
                type="text"
                className={`input${fieldErrors.department ? ' input-error' : ''}`}
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
                autoComplete="organization"
              />
              {fieldErrors.department && (
                <span className="input-error-msg">{fieldErrors.department}</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email address <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`input${fieldErrors.email ? ' input-error' : ''}`}
                placeholder="you@student.edu.ng"
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
