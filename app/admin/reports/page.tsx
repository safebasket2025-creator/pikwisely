import { createClient } from '@/lib/supabase-server';

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const supabaseAdmin = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let reports: any[] = [];
  let error: string | null = null;

  try {
    // We join with profiles to get the user's email.
    // If the email column is on profiles, this is easy. If not, it returns what's available.
    const { data, error: rErr } = await supabaseAdmin
      .from('reports')
      .select('id, created_at, input_text, profiles(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (rErr) {
      if (rErr.code === 'PGRST205' || rErr.code === '42P01') {
        error = "Reports table not found.";
      } else {
        error = `Failed to load reports: ${rErr.message}`;
      }
    } else {
      reports = data || [];
    }
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: 24, letterSpacing: '-0.02em' }}>
        Recent Reports
      </h1>

      {error ? (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 24, color: '#991b1b' }}>
          <strong>Couldn&apos;t load this data:</strong> {error}
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(248,250,252,0.6)' }}>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Input Snippet</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>No reports found.</td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid rgba(226,232,240,0.8)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.profiles?.email || 'Unknown User'}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.input_text || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                        background: r.status === 'completed' ? '#dcfce7' : '#f1f5f9',
                        color: r.status === 'completed' ? '#166534' : '#475569'
                      }}>
                        {r.status || 'completed'}
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
