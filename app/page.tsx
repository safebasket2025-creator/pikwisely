import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'Pikwisely — Know Before You Sell',
  description: 'Paste product reviews and get an instant AI analysis report — sentiment breakdown, top complaints, strengths, and actionable insights in seconds.',
};

export default function Page() {
  return (
    <>
      <Navbar activePage="home" />
      <HomePage />
      <Footer />
    </>
  );
}
