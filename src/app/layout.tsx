import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAVE-BITE | Hyper-Local Surplus Marketplace & Explainable Pricing Engine',
  description: 'Rescue perishable food from bakeries, cafes, and canteens with explainable human-in-the-loop pricing and zero-checkout walk-in discovery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
