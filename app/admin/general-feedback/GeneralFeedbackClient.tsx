'use client';

import { useState } from 'react';

export default function GeneralFeedbackClient({ feedbacks, error }: { feedbacks: any[], error: string | null }) {
  const [filter, setFilter] = useState('all');

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === 'all') return true;
    return f.category === filter;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          General Feedback
        </h1>

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: 'white',
            color: '#334155',
            fontSize: '0.9rem',
            fontWeight: 500,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Categories</option>
          <option value="bug">Bug/Error</option>
          <option value="slow">Slow/Not Working</option>
          <option value="suggestion">Suggestion</option>
          <option value="other">Other</option>
        </select>
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
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Message</th>
                <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>URL</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>No feedback found.</td>
                </tr>
              ) : (
                filteredFeedbacks.map(f => (
                  <tr key={f.id} style={{ borderTop: '1px solid rgba(226,232,240,0.8)' }}>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.user_email || 'Guest'}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' }}>
                      {new Date(f.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                        background: f.category === 'bug' ? '#fee2e2' : f.category === 'slow' ? '#ffedd5' : f.category === 'suggestion' ? '#e0e7ff' : '#f1f5f9',
                        color: f.category === 'bug' ? '#991b1b' : f.category === 'slow' ? '#9a3412' : f.category === 'suggestion' ? '#3730a3' : '#334155'
                      }}>
                        {f.category.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#334155', maxWidth: '300px', wordWrap: 'break-word' }}>
                      {f.message}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                      <a href={f.page_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'none' }}>
                        {f.page_url.length > 30 ? f.page_url.substring(0, 30) + '...' : f.page_url}
                      </a>
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
