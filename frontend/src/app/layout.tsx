import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Lexend } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Font configurations optimized for EdTech/Learning
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true, // Preload for primary font
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
  preload: true, // Preload for headings
});

// Optional: Lexend is specifically designed for reading proficiency
const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-reading',
  weight: ['400', '500', '600'],
  preload: false,
});

// Get the site URL with fallback
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Metadata configuration
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Preplyte - Placement Preparation Platform',
    template: '%s | Preplyte',
  },
  description:
    'The complete platform for placement preparation. Practice aptitude tests, coding challenges, AI mock interviews, and build your perfect resume.',
  keywords: [
    'placement preparation',
    'aptitude tests',
    'coding challenges',
    'mock interviews',
    'resume builder',
    'campus placements',
    'job preparation',
    'interview preparation',
    'technical interviews',
    'HR interviews',
    'group discussions',
    'placement training',
  ],
  authors: [{ name: 'Preplyte Team' }],
  creator: 'Preplyte',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'Preplyte - Complete Placement Preparation Platform',
    description:
      'Prepare for campus placements with aptitude tests, coding challenges, AI interviews, and resume building tools.',
    siteName: 'Preplyte',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Preplyte - Your Path to Placement Success',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preplyte - Placement Preparation Platform',
    description:
      'Your one-stop solution for placement preparation. Practice, learn, and succeed.',
    images: ['/og-image.png'],
    creator: '@preplyte',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
   

    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: siteUrl,
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${plusJakartaSans.variable} ${lexend.variable}`} 
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body 
        className="font-sans bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary" 
        suppressHydrationWarning
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pb-16">{children}</main>
            <Footer />
          </div>
        </Providers>
        <div id="portal-root" />
      </body>
    </html>
  );
}