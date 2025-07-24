import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/layout/dashboard-nav';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // TODO: Add authentication check here
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   redirect('/auth/login');
  // }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto bg-muted/10 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}