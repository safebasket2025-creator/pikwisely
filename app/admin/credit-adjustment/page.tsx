'use client';

import { useState, useEffect, useRef } from 'react';

export default function CreditAdjustmentPage() {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch users for autocomplete
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.profiles) setUsers(data.profiles);
      })
      .catch(() => {}); // silently fail if table doesn't exist yet
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/adjust-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to adjust credits');
      }

      setMessage({ type: 'success', text: `Successfully adjusted credits for ${email}. New limit: ${data.newLimit}` });
      setEmail('');
      setAmount(0);
      setReason('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => u.email && u.email.toLowerCase().includes(email.toLowerCase()));

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: 24, letterSpacing: '-0.02em' }}>
        Manual Credit Adjustment
      </h1>
      
      <div className="glass" style={{ padding: 32, borderRadius: 16, maxWidth: 500 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              Target User Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="user@example.com"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
              autoComplete="off"
            />
            
            {showDropdown && email && filteredUsers.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', borderRadius: 12, border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                {filteredUsers.map(u => (
                  <div 
                    key={u.id}
                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}
                    onClick={() => {
                      setEmail(u.email);
                      setShowDropdown(false);
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{u.email}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.full_name || 'No Name'} • {u.plan || 'Free'} Plan</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="amount" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              Amount to Add/Subtract
            </label>
            <input
              id="amount"
              type="number"
              required
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value) || 0)}
              placeholder="e.g. 10 or -5"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
            />
          </div>

          <div>
            <label htmlFor="reason" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              Reason (for logs)
            </label>
            <input
              id="reason"
              type="text"
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Refund issued, Customer support"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: '#4f46e5',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: 8
            }}
          >
            {loading ? 'Applying...' : 'Apply Adjustment'}
          </button>

          {message && (
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '0.9rem',
              fontWeight: 500,
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
