'use client';

import { useState, useEffect } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const [overridingUser, setOverridingUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'PGRST205' || data.code === '42P01') {
          throw new Error('Profiles table or email column not found. Run the SQL setup script first.');
        }
        throw new Error(data.error || 'Failed to load users');
      }
      setUsers(data.profiles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePlanOverride = async (email: string, newPlan: string) => {
    if (!confirm(`Are you sure you want to change ${email}'s plan to ${newPlan.toUpperCase()}? This will reset their credits.`)) return;
    setOverridingUser(email);
    try {
      const res = await fetch('/api/admin/override-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to override plan');
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOverridingUser(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.email || '').toLowerCase().includes(search.toLowerCase()) || (u.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || (u.plan || 'free').toLowerCase() === planFilter;
    return matchSearch && matchPlan;
  });

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: 24, letterSpacing: '-0.02em' }}>
        Users
      </h1>

      {error ? (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 24, color: '#991b1b' }}>
          <strong>Couldn&apos;t load this data:</strong> {error}
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          {/* Controls */}
          <div style={{ padding: '20px 24px', display: 'flex', gap: 16, borderBottom: '1px solid rgba(226,232,240,0.8)', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search by email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
            <select 
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(248,250,252,0.6)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credits</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan Override</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>No users found matching your filters.</td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderTop: '1px solid rgba(226,232,240,0.8)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.email || 'No Email (Backfill required)'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.full_name || 'No Name'}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>{u.reports_limit - u.reports_used} / {u.reports_limit}</div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <select 
                          disabled={overridingUser === u.email}
                          value={u.plan || 'free'}
                          onChange={(e) => handlePlanOverride(u.email, e.target.value)}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', cursor: 'pointer' }}
                        >
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                        </select>
                        {overridingUser === u.email && <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#6366f1' }}>Updating...</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
