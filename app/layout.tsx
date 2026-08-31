import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pasar POS - Kasir Pasar Multi-Satuan & Multi-Nota',
  description: 'Aplikasi Kasir POS Pasar Tradisional & Grosir dengan Katalog Foto, Multi-Satuan, Timbangan, dan Multi-Nota Active.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#059669',
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
      <body>{children}</body>
    </html>
  );
}
