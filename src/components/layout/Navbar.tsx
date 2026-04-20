// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, GitCompare, Calculator, Building2, LandPlot } from 'lucide-react';
import clsx from 'clsx';

const links = [
  { href: '/',             label: 'Imóveis',             icon: Home },
  { href: '/developments', label: 'Empreendimentos',     icon: Building2 },
  { href: '/affordable',   label: 'Affordable Scheme',   icon: LandPlot },
  { href: '/dashboard',    label: 'Dashboard Financeiro',icon: BarChart3 },
  { href: '/compare',      label: 'Comparar',            icon: GitCompare },
  { href: '/calculator',   label: 'Calculadora',         icon: Calculator },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-2">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
            <span className="text-2xl">🏠</span>
            <span
              className="font-serif text-xl text-gray-900 hidden sm:block"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Casa<span style={{ color: '#1D9E75' }}>IE</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 overflow-x-auto">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/' ? pathname === '/' : pathname.startsWith(href);
              const isAffordable = href === '/affordable';
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                    active
                      ? isAffordable
                        ? 'bg-violet-50 text-violet-700'
                        : 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  )}
                >
                  <Icon size={15} />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
