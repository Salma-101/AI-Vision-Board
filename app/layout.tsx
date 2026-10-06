import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Visionary — Visualize the life you\'re building',
  description: 'Turn your goals into a personalized visual vision board. Describe what you want to achieve, and watch your vision come to life.',
  openGraph: {
    title: 'Visionary — Visualize the life you\'re building',
    description: 'Turn your goals into a personalized visual vision board.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
