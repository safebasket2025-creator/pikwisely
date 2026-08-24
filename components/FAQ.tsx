'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'When do my reports reset?',
      a: "Free plan reports reset every month to 3. Starter and Pro plan reports also reset monthly to your plan's allotment (40 for Starter, 150 for Pro).",
    },
    {
      q: 'Can I cancel anytime?',
      a: "Yes, you can cancel your subscription anytime from your account settings. You'll continue to have access until the end of your current billing cycle.",
    },
    {
      q: 'What happens if I run out of reports?',
      a: "You can upgrade to a higher plan anytime to get more reports immediately, or wait until your next billing cycle when your reports reset.",
    },
    {
      q: 'Can I get a refund?',
      a: (
        <>
          Yes — refund requests are accepted within 7 days of purchase, as long as you've used 5 or fewer reports (Starter plan) or 10 or fewer reports (Pro plan) during that billing cycle. See our full <Link href="/refund-policy" style={{ color: '#6366f1', textDecoration: 'underline' }}>Refund Policy</Link> for details.
        </>
      ),
    },
    {
      q: 'Do you store my data securely?',
      a: "Yes. Your reviews and reports are stored securely using Supabase, an industry-standard secure database provider. We never share your data with third parties.",
    },
    {
      q: 'What if the AI analysis seems wrong?',
      a: "Every report includes a feedback option (👍/👎) so you can tell us if an analysis seems off. We use this feedback to continuously improve accuracy.",
    },
  ];

  return (
    <section id="faq" style={{ position: 'relative', zIndex: 10, padding: '0 24px 100px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h2 className="animate-fade-up" style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 40 }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={faq.q} className={`faq-item animate-fade-up-2${openFaq === i ? ' open' : ''}`}>
              <button
                className="faq-btn"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                aria-controls={`faq-body-${i}`}
                id={`faq-btn-${i}`}
              >
                {faq.q}
                <span className="faq-icon" aria-hidden="true">
                  <svg width="12" height="12" fill="none" viewBox="0 0 14 14" stroke="#6366f1" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 1v12M1 7h12"/>
                  </svg>
                </span>
              </button>
              <div className="faq-body" id={`faq-body-${i}`} role="region" aria-labelledby={`faq-btn-${i}`}>
                <div className="faq-body-inner">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
