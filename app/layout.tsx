import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'AudioBook Hub',
  description: 'Your personal audiobook catalog',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
