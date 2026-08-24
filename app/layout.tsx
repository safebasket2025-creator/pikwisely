import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Pikwisely — Know Before You Sell',
    template: '%s — Pikwisely',
  },
  description:
    'Paste product reviews and get an instant AI analysis report — sentiment breakdown, top complaints, strengths, and actionable insights in seconds.',
  keywords: [
    'product review analysis',
    'Amazon review analyzer',
    'Flipkart review analysis',
    'AI product reviews',
    'seller tool',
    'review analyzer',
  ],
};

import GeneralFeedbackButton from '@/components/GeneralFeedbackButton';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <GeneralFeedbackButton />
      </body>
    </html>
  );
}
