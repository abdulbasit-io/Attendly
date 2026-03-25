import Link from 'next/link';
import { MapPin } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-5)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
          }}
        >
          <MapPin size={28} />
        </div>
        <div>
          <p
            style={{
              fontSize: '72px',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-primary)',
              lineHeight: 1,
              marginBottom: 'var(--space-3)',
              letterSpacing: '-0.04em',
            }}
          >
            404
          </p>
          <h1
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Page not found
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link href="/" className="btn btn-primary">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
