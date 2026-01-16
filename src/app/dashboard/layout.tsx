import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { redirect } from 'next/navigation';
import { assertAdmin } from '@/server/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await assertAdmin();
  } catch (error) {
    redirect('/login');
  }

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
