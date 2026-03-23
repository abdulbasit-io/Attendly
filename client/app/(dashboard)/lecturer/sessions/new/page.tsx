'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function NewSessionContent() {
  const params = useSearchParams();
  const router = useRouter();
  const courseId = params.get('courseId') || '';

  return (
    <div>
      <div className="breadcrumb" style={{ marginBottom: 'var(--space-5)' }}>
        <Link href="/lecturer/dashboard">Courses</Link>
        <span className="breadcrumb-sep">/</span>
        <Link href={`/lecturer/courses/${courseId}`}>Course</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">New Session</span>
      </div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Start Session</h1>
          <p className="page-subtitle">Configure and launch an attendance session</p>
        </div>
      </div>
      <div className="card card-padded" style={{ maxWidth: 500 }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Session creation (GPS capture, QR generation, WhatsApp share) — coming in Sprint 3.
        </p>
      </div>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense>
      <NewSessionContent />
    </Suspense>
  );
}
