import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingContent from '@/components/PricingContent';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Pikwisely. Start free with 3 reports per month. Upgrade for unlimited access.',
};

export default function PricingPage() {
  return (
    <>
      <Navbar activePage="pricing" />
      <PricingContent />
      <Footer />
    </>
  );
}
