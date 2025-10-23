import type { ReactNode } from 'react';
import { DM_Sans } from 'next/font/google';
import { Metadata } from 'next/dist/lib/metadata/types/metadata-interface';

// Configure DM Sans font for LMS routes
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Learning Management System',
  description: 'Track your learning progress and achievements',
  generator: 'v0.app',
};

export default function LMSLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className={dmSans.variable}>
      {children} {/* Render LMS-specific pages or further nested layouts */}
    </div>
  );
}