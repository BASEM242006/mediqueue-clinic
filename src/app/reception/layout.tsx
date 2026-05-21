import DashboardShell from '@/components/layout/DashboardShell';

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell roleKey="reception" allowedRoles={['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']}>
      {children}
    </DashboardShell>
  );
}
