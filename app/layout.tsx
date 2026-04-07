import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/service-worker-register';

export const metadata: Metadata = {
  title: 'Receipt PWA',
  description: 'Privat kvitteringsapp til iPhone og web',
  appleWebApp: {
    capable: true,
    title: 'Receipt PWA',
    statusBarStyle: 'default'
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: '#1d4ed8'
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="da">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
