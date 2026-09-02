import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import AdminLayoutShell from '@/components/AdminLayoutShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const primaryEmail = user?.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;

  if (!primaryEmail) {
    redirect('/sign-in');
  }

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes(primaryEmail.toLowerCase());

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <AdminLayoutShell userEmail={primaryEmail}>
      {children}
    </AdminLayoutShell>
  );
}
