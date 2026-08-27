'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function TestToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showTest = searchParams.get('test') === 'true';

  const handleToggle = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (showTest) {
      params.delete('test');
    } else {
      params.set('test', 'true');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
      <label htmlFor="test-toggle" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
        Show test payments
      </label>
      <button
        id="test-toggle"
        role="switch"
        aria-checked={showTest}
        onClick={handleToggle}
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 9999,
          background: showTest ? '#6366f1' : '#cbd5e1',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.3s'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: showTest ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.3s'
        }} />
      </button>
    </div>
  );
}
