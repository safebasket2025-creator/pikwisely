import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';
import TestToggle from './TestToggle';

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const showTest = resolvedSearchParams?.test === 'true';
  const supabase = await createClient();

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  let payments: any[] = [];
  let error: string | null = null;

  try {
    let query = supabaseAdmin
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!showTest) {
      query = query.eq('is_test_payment', false);
    }

    const { data, error: pErr } = await query;

    if (pErr) {
      if (pErr.code === 'PGRST205' || pErr.code === '42P01') {
        error = "Payments table not found. Please run the SQL setup script.";
      } else {
        error = `Failed to load payments: ${pErr.message}`;
      }
    } else {
      payments = data || [];
    }
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
          Payments
        </h1>
        <TestToggle />
      </div>

      {error ? (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 24, color: '#991b1b' }}>
          <strong>This feature needs setup:</strong> {error}
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(248,250,252,0.6)' }}>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Email</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>No payments yet.</td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid rgba(226,232,240,0.8)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.user_email || 'Unknown User'}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569' }}>
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '0.95rem', color: '#10b981', fontWeight: 700 }}>
                        ₹{Number(p.amount).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4f46e5', textTransform: 'capitalize' }}>
                        {p.plan || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                        background: p.status === 'success' ? '#dcfce7' : '#fee2e2',
                        color: p.status === 'success' ? '#166534' : '#991b1b'
                      }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
