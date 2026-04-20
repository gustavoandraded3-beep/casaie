// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'CasaIE — Rastreador de Imóveis na Irlanda',
  description: 'Acompanhe, compare e avalie imóveis que você está considerando comprar na Irlanda.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
