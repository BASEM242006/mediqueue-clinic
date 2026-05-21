import DashboardShell from '@/components/layout/DashboardShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell roleKey="admin" allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      {children}
    </DashboardShell>
  );
}
