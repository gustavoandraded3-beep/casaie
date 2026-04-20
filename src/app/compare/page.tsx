// src/app/compare/page.tsx
'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { simulateProperty, fmtEuro } from '@/lib/calculations';
import { SectionHeader, ViabilityBadge, StarRating, EmptyState, Button } from '@/components/ui';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export default function ComparePage() {
  const { properties, fin } = useStore();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id]; // max 3, shift oldest
      return [...prev, id];
    });
  };

  const chosen = properties.filter((p) => selected.includes(p.id));

  if (properties.length === 0) {
    return (
      <div>
        <SectionHeader title="Comparar Imóveis" />
        <EmptyState
          icon="⚖️"
          title="Nenhum imóvel para comparar"
          description="Adicione imóveis na aba Imóveis primeiro."
        />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Comparar Imóveis"
        subtitle="Selecione até 3 imóveis para comparar lado a lado"
      />

      {/* Selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Selecionar imóveis ({selected.length}/3)
        </p>
        <div className="flex flex-wrap gap-2">
          {properties.map((p) => {
            const isSelected = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={clsx(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                )}
              >
                {isSelected && <Check size={13} />}
                {p.name || 'Sem nome'}
                <span className="opacity-70 font-normal text-xs">
                  {p.price ? fmtEuro(Number(p.price)) : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {chosen.length < 2 ? (
        <EmptyState
          icon="👆"
          title="Selecione ao menos 2 imóveis"
          description="Clique nos botões acima para selecionar."
        />
      ) : (
        <CompareTable properties={chosen} fin={fin} />
      )}
    </div>
  );
}

// ─── Compare table ───────────────────────────────────────────────────────────

import type { FinancialConfig } from '@/types';
import type { Property } from '@/types';

function CompareTable({
  properties,
  fin,
}: {
  properties: Property[];
  fin: FinancialConfig;
}) {
  const sims = properties.map((p) => simulateProperty(p, fin));

  const rows: {
    label: string;
    render: (p: Property, idx: number) => React.ReactNode;
    highlight?: boolean;
  }[] = [
    {
      label: 'Preço',
      highlight: true,
      render: (p) => (
        <span className="font-bold text-emerald-600 text-base">
          {p.price ? fmtEuro(Number(p.price)) : '—'}
        </span>
      ),
    },
    {
      label: 'Cidade',
      render: (p) => p.city || '—',
    },
    {
      label: 'Tamanho',
      render: (p) => (p.area ? `${p.area}m²` : '—'),
    },
    {
      label: 'Quartos',
      render: (p) => p.rooms || '—',
    },
    {
      label: 'Avaliação',
      render: (p) => <StarRating value={p.rating} size={14} />,
    },
    {
      label: 'Visitado',
      render: (p) =>
        p.visited ? (
          <span className="text-emerald-600 font-medium">✓ Sim</span>
        ) : (
          <span className="text-gray-400">Não</span>
        ),
    },
    {
      label: 'Favorito',
      render: (p) =>
        p.favorite ? (
          <span className="text-amber-500">⭐ Sim</span>
        ) : (
          <span className="text-gray-400">Não</span>
        ),
    },
    {
      label: 'Depósito (10%)',
      render: (_, i) => fmtEuro(sims[i].deposit),
    },
    {
      label: 'Seus fundos',
      render: (_, i) => fmtEuro(sims[i].availableFunds),
    },
    {
      label: 'Gap do depósito',
      render: (_, i) => {
        const gap = sims[i].depositGap;
        return (
          <span className={gap > 0 ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>
            {gap > 0 ? `-${fmtEuro(gap)}` : `+${fmtEuro(Math.abs(gap))}`}
          </span>
        );
      },
    },
    // AIP 1 rows
    {
      label: `${fin.aip1Bank || 'Banco 1'} — Viabilidade`,
      highlight: true,
      render: (_, i) => <ViabilityBadge status={sims[i].aip1.status} />,
    },
    {
      label: `${fin.aip1Bank || 'Banco 1'} — FHS necessário`,
      render: (_, i) =>
        sims[i].aip1.fhsRequired > 0
          ? fmtEuro(sims[i].aip1.fhsRequired)
          : <span className="text-emerald-600">Não necessário</span>,
    },
    {
      label: `${fin.aip1Bank || 'Banco 1'} — Prestação/mês`,
      render: (_, i) => (
        <span className="font-semibold text-emerald-600">
          {fmtEuro(sims[i].aip1.monthlyPayment)}
        </span>
      ),
    },
    // AIP 2 rows
    {
      label: `${fin.aip2Bank || 'Banco 2'} — Viabilidade`,
      highlight: true,
      render: (_, i) => <ViabilityBadge status={sims[i].aip2.status} />,
    },
    {
      label: `${fin.aip2Bank || 'Banco 2'} — FHS necessário`,
      render: (_, i) =>
        sims[i].aip2.fhsRequired > 0
          ? fmtEuro(sims[i].aip2.fhsRequired)
          : <span className="text-emerald-600">Não necessário</span>,
    },
    {
      label: `${fin.aip2Bank || 'Banco 2'} — Prestação/mês`,
      render: (_, i) => (
        <span className="font-semibold text-emerald-600">
          {fmtEuro(sims[i].aip2.monthlyPayment)}
        </span>
      ),
    },
    // Notes
    {
      label: 'Pontos positivos',
      render: (p) => (
        <span className="text-xs text-gray-600 whitespace-pre-wrap">{p.pros || '—'}</span>
      ),
    },
    {
      label: 'Pontos negativos',
      render: (p) => (
        <span className="text-xs text-gray-600 whitespace-pre-wrap">{p.cons || '—'}</span>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '200px' }} />
            {properties.map((_, i) => (
              <col key={i} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Critério
              </th>
              {properties.map((p) => (
                <th
                  key={p.id}
                  className="text-center px-4 py-3 font-semibold text-gray-800"
                >
                  <div>{p.name || 'Sem nome'}</div>
                  {p.city && (
                    <div className="text-xs text-gray-400 font-normal">{p.city}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, render, highlight }) => (
              <tr
                key={label}
                className={clsx(
                  'border-b border-gray-50',
                  highlight ? 'bg-gray-50/60' : 'hover:bg-gray-50/40'
                )}
              >
                <td
                  className={clsx(
                    'px-4 py-2.5 text-gray-500',
                    highlight && 'font-semibold text-gray-700 text-xs uppercase tracking-wide'
                  )}
                >
                  {label}
                </td>
                {properties.map((p, i) => (
                  <td key={p.id} className="px-4 py-2.5 text-center text-gray-800">
                    {render(p, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
