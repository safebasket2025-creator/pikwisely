'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

export default function AdminLayoutShell({ userEmail, children }: { userEmail: string, children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Admin Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            className="sm:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Admin Menu"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shrink-0">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <span className="text-[1.1rem] font-extrabold text-slate-900 hidden sm:inline">Admin Dashboard</span>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="text-[0.85rem] text-slate-500 font-medium hidden sm:inline">{userEmail}</span>
          <Link href="/" className="text-[0.85rem] font-semibold text-indigo-600 no-underline px-3 py-1.5 bg-indigo-50 rounded-lg whitespace-nowrap hover:bg-indigo-100 transition-colors">
            Back to App
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 top-16 bg-slate-900/20 backdrop-blur-sm z-30 sm:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <main className="flex-1 p-4 sm:p-10 overflow-y-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
