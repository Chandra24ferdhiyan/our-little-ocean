import type { Metadata, Viewport } from 'next';
import { Manrope, DM_Serif_Display } from 'next/font/google';
import './globals.css';
import { AquariumProvider } from '@/lib/store/AquariumContext';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Candut & Repa — Our Little Ocean',
  description: 'Ruang interaktif tenang dan cerah untuk pasangan Candut & Repa. Samudera bawah air dengan sistem level 1–500, lima tema atmosferik, dan pesan gelembung intim.',
  keywords: ['aquarium', 'candut and repa', 'couple aquarium', 'our little ocean', 'indie web experience'],
  authors: [{ name: 'Candut & Repa' }],
  icons: {
    icon: [
      { url: '/brand-icon.png', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    shortcut: '/brand-icon.png',
    apple: '/brand-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F4F7F9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${manrope.variable} ${dmSerif.variable}`}>
      <body className="bg-[#F4F7F9] text-[#182C3A] font-sans antialiased min-h-screen selection:bg-[#F3C5D1] selection:text-[#182C3A]">
        <AquariumProvider>
          {children}
        </AquariumProvider>
      </body>
    </html>
  );
}
