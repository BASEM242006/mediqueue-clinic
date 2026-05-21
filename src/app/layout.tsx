import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import AppProviders from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: {
    default: 'MediQueue | Doctor & Clinic Management',
    template: '%s | MediQueue',
  },
  description:
    'Book appointments online and track your clinic queue in real time. Professional doctor and clinic management system.',
  keywords: ['clinic', 'doctor', 'appointments', 'queue', 'healthcare', 'عيادة', 'طبيب'],
  openGraph: {
    title: 'MediQueue Clinic Management',
    description: 'Real-time queue tracking and online appointment booking',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AppProviders>
          <Navbar />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
