import { createClient } from '@/lib/supabase-server';

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // We need to bypass RLS to count all users and reports
  const supabaseAdmin = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let totalUsers = 0;
  let planCounts = { free: 0, starter: 0, pro: 0 };
  let totalReports = 0;
  let totalRevenue = 0;
  let errors: string[] = [];

  try {
    // 1. Fetch Users
    const { data: profiles, error: pErr } = await supabaseAdmin.from('profiles').select('plan');
    if (pErr) {
      if (pErr.code === 'PGRST205' || pErr.code === '42P01') errors.push("Profiles table not found.");
      else errors.push(`Users error: ${pErr.message}`);
    } else {
      totalUsers = profiles.length;
      profiles.forEach((p: any) => {
        const plan = (p.plan || 'free').toLowerCase();
        if (plan === 'pro') planCounts.pro++;
        else if (plan === 'starter') planCounts.starter++;
        else planCounts.free++;
      });
    }

    // 2. Fetch Reports count
    const { count: reportsCount, error: rErr } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true });
    if (rErr) {
      if (rErr.code === 'PGRST205' || rErr.code === '42P01') errors.push("Reports table not found.");
      else errors.push(`Reports error: ${rErr.message}`);
    } else {
      totalReports = reportsCount || 0;
    }

    // 3. Fetch Revenue (Current Month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: payments, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .gte('created_at', startOfMonth.toISOString())
      .eq('status', 'success');

    if (payErr) {
      if (payErr.code === 'PGRST205' || payErr.code === '42P01') {
        // Table doesn't exist yet, gracefully handle
        errors.push("Payments table not found. Run SQL setup to create it.");
      } else {
        errors.push(`Payments error: ${payErr.message}`);
      }
    } else {
      totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    }
  } catch (err: any) {
    errors.push(err.message);
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: 24, letterSpacing: '-0.02em' }}>
        Overview
      </h1>

      {errors.length > 0 && (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>Setup Required / Warnings:</h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#b91c1c', fontSize: '0.85rem' }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {/* Total Users */}
        <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Total Users</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{totalUsers}</p>
        </div>

        {/* Total Reports */}
        <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Reports Generated</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{totalReports}</p>
        </div>

        {/* Total Revenue */}
        <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Monthly Revenue</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
            ₹{totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Users by Plan</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        <div className="glass" style={{ padding: 20, borderRadius: 12, borderTop: '4px solid #94a3b8' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Free Plan</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{planCounts.free}</p>
        </div>
        <div className="glass" style={{ padding: 20, borderRadius: 12, borderTop: '4px solid #6366f1' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Starter Plan</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{planCounts.starter}</p>
        </div>
        <div className="glass" style={{ padding: 20, borderRadius: 12, borderTop: '4px solid #a855f7' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Pro Plan</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{planCounts.pro}</p>
        </div>
      </div>
    </div>
  );
}
