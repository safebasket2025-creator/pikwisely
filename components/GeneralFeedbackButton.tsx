'use client';

import { useState, useEffect } from 'react';

export default function GeneralFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Prevent scrolling on body when modal is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !message.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/feedback/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          page_url: window.location.href,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');

      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setCategory('');
        setMessage('');
        setStatus('idle');
      }, 2000);
    } catch (err) {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center group">
        <span className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/80 text-white text-xs px-2.5 py-1.5 rounded-md backdrop-blur-md hidden sm:block whitespace-nowrap font-medium pointer-events-none">
          Feedback
        </span>
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-white/70 backdrop-blur-xl saturate-150 border border-slate-200/50 shadow-lg flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-white/90 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex-shrink-0"
          aria-label="Send Feedback"
        >
          <svg
            width="22"
            height="22"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center sm:items-end sm:justify-end sm:p-6 sm:pb-20 pointer-events-none">
          {/* Backdrop for mobile */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm sm:hidden pointer-events-auto" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className="relative w-full max-w-sm bg-white/80 backdrop-blur-2xl saturate-150 border border-white sm:border-slate-200/80 sm:rounded-2xl shadow-2xl p-6 sm:mr-[64px] sm:mb-[64px] rounded-t-2xl sm:rounded-b-2xl pointer-events-auto mt-auto sm:mt-0 transform transition-all animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 sm:slide-in-from-right-4 duration-300">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100/50 hover:bg-slate-200/50 rounded-full p-1.5 transition-colors"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Feedback</h3>
            <p className="text-sm text-slate-500 mb-5">Help us improve Pikwisely.</p>

            {status === 'success' ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-slate-800 font-medium">Thanks!</p>
                <p className="text-slate-500 text-sm mt-1">We've received your feedback.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    What's this about? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none shadow-sm"
                  >
                    <option value="" disabled>Select a category...</option>
                    <option value="bug">Bug/Error</option>
                    <option value="slow">Slow or not working</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="other">Something else</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tell us what happened <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please provide details..."
                    rows={4}
                    className="w-full bg-white/50 border border-slate-200/80 rounded-xl px-3.5 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none shadow-sm placeholder:text-slate-400"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-600 font-medium bg-red-50 py-2 px-3 rounded-lg">
                    Couldn't send feedback, please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Feedback'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
