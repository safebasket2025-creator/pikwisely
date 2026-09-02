'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Script from 'next/script';
import { clientEnv } from '@/lib/env';
import FAQ from './FAQ';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: '/month',
    desc: 'Perfect for trying things out.',
    features: [
      { text: '3 reports per month', included: true },
      { text: 'Full AI analysis', included: true },
      { text: 'Confidence score & mixed signals', included: true },
      { text: 'Download report as PDF', included: false },
      { text: 'Report history (view past reports)', included: false },
    ],
    cta: 'Start Free',
    popular: false,
    accent: false,
  },
  {
    name: 'Starter',
    price: '₹499',
    period: '/month',
    desc: 'For active sellers who check regularly.',
    features: [
      { text: '40 reports per month', included: true },
      { text: 'Full AI analysis', included: true },
      { text: 'Confidence score & mixed signals', included: true },
      { text: 'Download report as PDF', included: true },
      { text: 'Report history (view past reports)', included: true },
    ],
    cta: 'Choose Starter',
    popular: true,
    accent: true,
  },
  {
    name: 'Pro',
    price: '₹1499',
    period: '/month',
    desc: 'For serious sellers and agencies.',
    features: [
      { text: '150 reports per month', included: true },
      { text: 'Full AI analysis', included: true },
      { text: 'Confidence score & mixed signals', included: true },
      { text: 'Download report as PDF', included: true },
      { text: 'Report history (view past reports)', included: true },
    ],
    cta: 'Choose Pro',
    popular: false,
    accent: false,
  },
];
export default function PricingContent() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handlePlanClick = async (e: React.MouseEvent, planName: string) => {
    e.preventDefault();
    if (!isLoaded) return; // wait for session

    if (!isSignedIn) {
      router.push('/sign-up');
      return;
    }

    if (planName === 'Free') {
      router.push('/analyze');
      return;
    }

    // Razorpay flow for Starter / Pro
    if (isLoading) return;
    setIsLoading(true);

    try {
      const plan = planName.toLowerCase();
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user?.id })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      const options = {
        key: clientEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: plan === 'starter' ? 49900 : 149900,
        currency: 'INR',
        name: clientEnv.NEXT_PUBLIC_APP_NAME,
        description: `Upgrade to ${planName} Plan`,
        order_id: data.order_id,
        prefill: {
          email: user?.primaryEmailAddress?.emailAddress
        },
        handler: function (response: any) {
          // payment success
          alert('Payment successful! Redirecting to dashboard...');
          router.push('/analyze');
        },
        theme: {
          color: '#6366f1'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        console.error(response.error);
        alert("Payment failed! Please try again.");
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong creating the order.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Floating blobs */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="blob-a" style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(165,180,252,0.24)', filter: 'blur(80px)', top: -120, left: -80 }} />
        <div className="blob-b" style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(196,181,253,0.20)', filter: 'blur(70px)', top: '5%', right: -60, animationDelay: '1.5s' }} />
        <div className="blob-a" style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'rgba(147,197,253,0.18)', filter: 'blur(75px)', bottom: '10%', left: '20%', animationDelay: '3s' }} />
      </div>

      {/* Hero headline */}
      <section style={{ position: 'relative', zIndex: 10, paddingTop: 120, paddingBottom: 64, textAlign: 'center', paddingLeft: 24, paddingRight: 24 }}>
        <div className="badge-pill animate-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 9999, marginBottom: 28 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4338ca', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Simple Pricing</span>
        </div>

        <h1 className="animate-fade-up-2" style={{ fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 14 }}>
          Simple, <span className="headline-accent">Transparent</span> Pricing
        </h1>
        <p className="animate-fade-up-3" style={{ fontSize: '1.05rem', color: '#64748b', fontWeight: 400, maxWidth: 420, margin: '0 auto', lineHeight: 1.65 }}>
          Choose the plan that fits how often you check products.
        </p>
      </section>

      {/* Pricing cards */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', maxWidth: 1000, margin: '0 auto', alignItems: 'flex-start' }}>
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card animate-fade-up-2${plan.popular ? ' popular' : ''}`} style={{ flex: '1 1 300px', maxWidth: '400px' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 16px', borderRadius: 9999, background: 'linear-gradient(135deg,#4f46e5,#6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.40)', whiteSpace: 'nowrap' }}>
                  <svg width="11" height="11" fill="#fff" viewBox="0 0 20 20" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Most Popular</span>
                </div>
              )}

              {/* Plan name & price */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: plan.popular ? '#4f46e5' : '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 'clamp(2rem,4vw,2.6rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 400, lineHeight: 1.5 }}>{plan.desc}</p>
              </div>

              {/* CTA */}
              <button
                onClick={(e) => handlePlanClick(e, plan.name)}
                className={plan.accent ? 'btn-primary' : 'btn-outline'}
                style={{ marginBottom: 24, textDecoration: 'none', width: '100%' }}
              >
                {plan.cta}
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(226,232,240,0.70)', marginBottom: 22 }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {plan.features.map(f => (
                  <li key={f.text} className="feature-item" style={{ opacity: f.included ? 1 : 0.45 }}>
                    <span className={`feature-check${plan.popular && f.included ? ' green' : f.included ? ' indigo' : ''}`}>
                      {f.included ? (
                        <svg width="9" height="9" fill="none" viewBox="0 0 14 14" stroke={plan.popular ? '#10b981' : '#6366f1'} strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2 7l3.5 3.5L12 3"/></svg>
                      ) : (
                        <svg width="9" height="9" fill="none" viewBox="0 0 14 14" stroke="#94a3b8" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l8 8M11 3L3 11"/></svg>
                      )}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <FAQ />
    </main>
  );
}
