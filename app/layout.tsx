import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pasar POS - Kasir Pasar Multi-Satuan & Multi-Nota',
  description: 'Aplikasi Kasir POS Pasar Tradisional & Grosir dengan Katalog Foto, Multi-Satuan, Timbangan, dan Multi-Nota Active.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pasar POS',
  },
};

export const viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <div className="mobile-app-wrapper">
          {children}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
