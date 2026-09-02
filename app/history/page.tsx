'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { createClerkSupabaseClient } from '@/lib/supabase-clerk';
import Navbar from '@/components/Navbar';
import AnalysisResult from '@/components/AnalysisResult';
import type { GroqAnalysisResult } from '@/lib/groq';

type ReportRow = {
  id: string;
  created_at: string;
  report_data: GroqAnalysisResult;
  review_count: number;
};

export default function HistoryPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    async function loadHistory() {
      const token = await getToken({ template: 'supabase' });
      const supabase = createClerkSupabaseClient(token);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('reports_limit')
        .single();
        
      if (profile?.reports_limit === 3) {
        setIsFreePlan(true);
        setLoading(false);
        return;
      }

      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (reportsData) {
        setReports(reportsData);
      }
      
      setLoading(false);
    }
    loadHistory();
  }, [isLoaded, isSignedIn, router, getToken]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner spinner-dark" />
      </div>
    );
  }

  // Upgrade Screen for Free Tier
  if (isFreePlan) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f8fafc' }}>
          <div style={{ textAlign: 'center', maxWidth: 460, background: '#fff', padding: '48px 32px', borderRadius: 24, boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 64, height: 64, background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#4f46e5" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Unlock Report History</h1>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              The Free plan does not include report history. Upgrade to Starter or Pro to save and review all your past product analyses anytime.
            </p>
            <Link href="/pricing" style={{ display: 'inline-block', padding: '12px 24px', background: '#4f46e5', color: '#fff', fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
              View Plans
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '100px 24px 40px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Report History</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>View your past product analyses.</p>

        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: 20, border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b', marginBottom: 16 }}>No reports yet — head to Analyze to get your first one.</p>
            <Link href="/analyze" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Start Analyzing
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reports.map((report) => {
              const isExpanded = expandedId === report.id;
              const dateObj = new Date(report.created_at);
              const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              const { suggestion, productName } = report.report_data;

              // Basic color mapping for the list item
              let badgeBg = '#e2e8f0', badgeColor = '#475569';
              if (suggestion === 'Strong Opportunity') { badgeBg = '#d1fae5'; badgeColor = '#059669'; }
              if (suggestion === 'Proceed with Caution') { badgeBg = '#fef3c7'; badgeColor = '#d97706'; }
              if (suggestion === 'High Risk') { badgeBg = '#ffe4e6'; badgeColor = '#e11d48'; }

              return (
                <div key={report.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                    style={{ padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>{dateStr}</span>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: badgeBg, color: badgeColor, whiteSpace: 'nowrap' }}>
                          {suggestion}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {productName || 'Unknown Product'}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {report.report_data.keyTakeaway}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{report.review_count}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Reviews</span>
                      </div>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f1f5f9', marginTop: -8 }}>
                      <div style={{ marginTop: 20 }}>
                        <AnalysisResult {...report.report_data} reportId={report.id} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
