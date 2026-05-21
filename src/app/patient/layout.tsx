import DashboardShell from '@/components/layout/DashboardShell';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell roleKey="patient" allowedRoles={['PATIENT']}>
      {children}
    </DashboardShell>
  );
}
