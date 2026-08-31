import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pasar POS - Kasir Pasar Multi-Satuan & Multi-Nota',
  description: 'Aplikasi Kasir POS Pasar Tradisional & Grosir dengan Katalog Foto, Multi-Satuan, Timbangan, dan Multi-Nota Active.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pasar POS',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <div className="mobile-app-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
