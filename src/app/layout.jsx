import '../styles.css';
import MobileNav from '../components/MobileNav.jsx';
import ScrollToTop from '../components/ScrollToTop.jsx';
import NavigationProgress from '../components/NavigationProgress.jsx';
import SWRegister from '../components/SWRegister.jsx';
import InstallPrompt from '../components/InstallPrompt.jsx';
import OnboardingWrapper from '../components/OnboardingWrapper.jsx';
import { Toaster } from '../components/ui/Toast.jsx';

// viewport must be exported via this API in Next.js 14+ App Router.
// Raw <meta name="viewport"> in JSX causes a console warning and is
// ignored by Turbopack's static metadata extraction.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#58cc02',
};

export const metadata = {
  title: {
    default:  'Aksarantara — Arsip Budaya Digital Bahasa Daerah Indonesia',
    template: '%s — Aksarantara',
  },
  description: 'Aksarantara adalah arsip budaya digital berbasis rekaman suara penutur asli — mendokumentasikan bahasa-bahasa daerah Indonesia, dimulai dari Bugis, Massenrempulu, Konjo, Minangkabau, dan Melayu Jambi. Terbuka untuk semua, selamanya.',
  keywords: [
    'bahasa daerah Indonesia',
    'arsip budaya digital',
    'pelestarian bahasa',
    'rekaman suara penutur asli',
    'bahasa Bugis',
    'bahasa Minangkabau',
    'bahasa Massenrempulu',
    'bahasa Konjo',
    'bahasa Melayu Jambi',
    'inklusi digital bahasa daerah',
    'teknologi sipil komunitas',
    'bahasa minoritas Indonesia',
    'dokumentasi bahasa',
  ],
  metadataBase: new URL('https://aksarantara.org'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Aksarantara — Arsip Digital Bahasa Daerah Indonesia',
    description: 'Arsip suara penutur asli dari 5 bahasa daerah yang terancam punah — Bugis, Massenrempulu, Konjo, Minangkabau, dan Melayu Jambi. Terbuka untuk semua.',
    url: 'https://aksarantara.org',
    siteName: 'Aksarantara',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/og.webp',
        width: 1200,
        height: 630,
        alt: 'Aksarantara — Arsip Digital Bahasa Daerah Indonesia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aksarantara — Arsip Digital Bahasa Daerah Indonesia',
    description: 'Rekaman otentik 5 bahasa daerah Indonesia yang terancam punah. Suara penutur asli, arsip terbuka untuk semua.',
    images: ['/og.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* viewport + themeColor moved to export const viewport above */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Aksarantara" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NavigationProgress />
        <ScrollToTop />
        <SWRegister />
        <InstallPrompt />
        {children}
        <MobileNav />
        <OnboardingWrapper />
        <Toaster />
      </body>
    </html>
  );
}
