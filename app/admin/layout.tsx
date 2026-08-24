import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import AdminLayoutShell from '@/components/AdminLayoutShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes(session.user.email.toLowerCase());

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <AdminLayoutShell userEmail={session.user.email}>
      {children}
    </AdminLayoutShell>
  );
}
