import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Pikwisely.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '120px 24px 80px', minHeight: '100vh' }}>
        <div className="glass-strong" style={{ padding: '40px 48px', borderRadius: 24 }}>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 32 }}>Last updated: {lastUpdated}</p>
          
          <div style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Introduction</strong>
              Pikwisely (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains what data we collect and how we use it.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Information We Collect</strong>
              Email address, account credentials (via Supabase Auth), pasted review text submitted for analysis, usage data (reports generated, credits used), payment information (processed securely by Razorpay — we do not store card details).
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>How We Use Your Information</strong>
              To provide the analysis service, manage your account and credits, process payments, send important account-related communications, and improve our AI analysis quality.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Data Storage &amp; Security</strong>
              Data is stored securely using Supabase, an industry-standard secure database provider. We do not sell or share your personal data with third parties for marketing purposes.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Third-Party Services</strong>
              We use Groq (AI analysis), Supabase (database/auth), Razorpay (payments) — each governed by their own privacy policies.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Your Rights</strong>
              You may request account deletion or data export by contacting <a href="mailto:support@pikwisely.site" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>support@pikwisely.site</a>.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Changes to This Policy</strong>
              We may update this policy; changes will be posted on this page.
            </div>

            <div>
              <strong style={{ color: '#0f172a', fontSize: '1.2rem', display: 'block', marginBottom: 8 }}>Contact</strong>
              For privacy questions, email <a href="mailto:support@pikwisely.site" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>support@pikwisely.site</a>.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
