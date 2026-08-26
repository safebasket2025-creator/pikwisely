import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';

export default async function AdminFeedbackPage() {
  const supabase = await createClient();

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  let feedbacks: any[] = [];
  let error: string | null = null;
  let positivePercentage = 0;

  try {
    const { data, error: fErr } = await supabaseAdmin
      .from('report_feedback')
      .select('id, created_at, rating, report_id, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (fErr) {
      if (fErr.code === 'PGRST205' || fErr.code === '42P01') {
        error = "Feedback table not found.";
      } else {
        error = `Failed to load feedback: ${fErr.message}`;
      }
    } else {
      feedbacks = data || [];
      const positiveCount = feedbacks.filter(f => f.rating === 'helpful').length;
      if (feedbacks.length > 0) {
        positivePercentage = Math.round((positiveCount / feedbacks.length) * 100);
      }
    }
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          Feedback
        </h1>
        
        {!error && feedbacks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', borderRadius: 16, border: '1px solid #86efac' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#166534', lineHeight: 1 }}>{positivePercentage}%</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Positive <br/> Feedback</span>
          </div>
        )}
      </div>

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
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report ID</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>No feedback received yet.</td>
                </tr>
              ) : (
                feedbacks.map(f => (
                  <tr key={f.id} style={{ borderTop: '1px solid rgba(226,232,240,0.8)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.profiles?.email || 'Unknown User'}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569' }}>
                      {new Date(f.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>
                      {f.report_id}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 8, fontSize: '0.9rem',
                        background: f.rating === 'helpful' ? '#dcfce7' : '#fee2e2',
                        color: f.rating === 'helpful' ? '#166534' : '#991b1b',
                        display: 'inline-flex', alignItems: 'center', gap: 6
                      }}>
                        {f.rating === 'helpful' ? '👍 Positive' : '👎 Negative'}
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
