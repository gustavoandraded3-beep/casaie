// src/components/layout/AppShell.tsx
// Wraps the whole app — shows loading spinner and error banner.
'use client';

import { useStore } from '@/lib/store';
import { Navbar } from './Navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loaded, error } = useStore();

  return (
    <>
      <Navbar />

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700 text-center">
          ⚠️ Erro de ligação à base de dados: {error}
        </div>
      )}

      {/* Loading overlay */}
      {!loaded && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">A carregar os seus dados...</p>
        </div>
      )}

      {/* Main content */}
      {loaded && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      )}
    </>
  );
}
