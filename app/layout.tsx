import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Palette Console',
  description: 'サービス統合ダッシュボード',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
