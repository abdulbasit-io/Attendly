import type { Metadata } from 'next';
import '../styles/globals.css';
import '../styles/components.css';

export const metadata: Metadata = {
  title: 'Attendly — Attendance as simple as a single scan',
  description: 'Location-smart, QR-based attendance system for universities. Lecturers create sessions, students scan to confirm — verified by GPS proximity.',
  keywords: ['attendance', 'university', 'QR code', 'GPS'],
  openGraph: {
    title: 'Attendly',
    description: 'With Attendly, attendance is as simple as a single scan.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
