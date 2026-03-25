'use client';

import { useState, FormEvent } from 'react';
import { User as UserIcon, Lock } from 'lucide-react';
import { getStoredUser, setStoredAuth, User } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import styles from './profile.module.css';

export default function LecturerProfilePage() {
  const stored = getStoredUser();
  const [user, setUser] = useState<User | null>(stored);

  // Profile form
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const data = await api.put<{ user: User }>('/api/auth/profile', { fullName });
      // Update local storage
      const tokens = {
        accessToken: localStorage.getItem('accessToken') ?? '',
        refreshToken: localStorage.getItem('refreshToken') ?? '',
      };
      setStoredAuth(data.user, tokens.accessToken, tokens.refreshToken);
      setUser(data.user);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  }

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      <div className={styles.profileLayout}>
        {/* Avatar card */}
        <div className={styles.avatarCard}>
          <div className="avatar avatar-xl">{initials}</div>
          <div>
            <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-lg)' }}>
              {user.fullName}
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {user.email}
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <span className="badge badge-brand">Lecturer</span>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <UserIcon size={16} color="var(--color-text-secondary)" />
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Personal Information</span>
            </div>
          </div>
          <form onSubmit={handleProfileSubmit}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {profileError && <div className="alert alert-error">{profileError}</div>}
              {profileSuccess && <div className="alert alert-success">Profile updated successfully.</div>}

              <div className="input-group">
                <label className="input-label">Full name</label>
                <input
                  type="text"
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email address</label>
                <input
                  type="email"
                  className="input"
                  value={user.email}
                  disabled
                />
                <span className="input-helper">Email cannot be changed</span>
              </div>
            </div>
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className={`btn btn-primary btn-sm${profileLoading ? ' btn-loading' : ''}`}
                disabled={profileLoading || fullName === user.fullName}
              >
                {profileLoading ? '' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password form */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Lock size={16} color="var(--color-text-secondary)" />
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Change Password</span>
            </div>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {passwordError && <div className="alert alert-error">{passwordError}</div>}
              {passwordSuccess && <div className="alert alert-success">Password updated successfully.</div>}

              <div className="input-group">
                <label className="input-label">Current password</label>
                <input
                  type="password"
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">New password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Confirm new password</label>
                <input
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className={`btn btn-primary btn-sm${passwordLoading ? ' btn-loading' : ''}`}
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                {passwordLoading ? '' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
