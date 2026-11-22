import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: { default: 'All Is Well — Phone Covers & Accessories', template: '%s · All Is Well' },
  description: 'Premium phone cases, screen protectors, watch straps, AirPods cases and MagSafe accessories. Cash on Delivery across India.',
};
export const viewport: Viewport = { themeColor: '#2563EB' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
