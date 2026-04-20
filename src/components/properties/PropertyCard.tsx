// src/components/properties/PropertyCard.tsx
'use client';

import { Star, MapPin, Maximize2, BedDouble, Building2 } from 'lucide-react';
import type { Property, ViabilityStatus } from '@/types';
import { HOUSE_TYPE_LABELS } from '@/types';
import { fmtEuro, simulateProperty } from '@/lib/calculations';
import { useStore } from '@/lib/store';
import { ViabilityBadge } from '@/components/ui';
import clsx from 'clsx';

interface Props {
  property: Property;
  onView: (p: Property) => void;
  onEdit: (p: Property) => void;
}

export function PropertyCard({ property: p, onView, onEdit }: Props) {
  const { fin, toggleFavorite, developments } = useStore();
  const sim = simulateProperty(p, fin);

  const bestStatus: ViabilityStatus =
    sim.aip1.status === 'green' || sim.aip2.status === 'green'
      ? 'green'
      : sim.aip1.status === 'yellow' || sim.aip2.status === 'yellow'
      ? 'yellow'
      : 'red';

  const dev = p.developmentId
    ? developments.find((d) => d.id === p.developmentId)
    : null;

  const houseTypeLabel =
    p.houseType ? HOUSE_TYPE_LABELS[p.houseType as keyof typeof HOUSE_TYPE_LABELS] : null;

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group',
        p.favorite ? 'border-amber-300' : 'border-gray-100 hover:border-emerald-300'
      )}
      onClick={() => onView(p)}
    >
      {p.favorite && <div className="h-1 rounded-t-xl bg-amber-400" />}

      {/* Property image (if set) */}
      {p.imageUrl && (
        <div className="w-full h-32 rounded-t-xl overflow-hidden bg-gray-100">
          <img
            src={p.imageUrl}
            alt={p.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Development badge */}
        {dev && (
          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5 mb-2 w-fit">
            <Building2 size={10} />
            {dev.name}
          </div>
        )}

        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{p.name || 'Sem nome'}</h3>
            {p.city && (
              <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin size={11} />
                {p.city}
              </span>
            )}
          </div>
          <button
            className="shrink-0 text-gray-300 hover:text-amber-400 transition-colors"
            onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
            aria-label="Favoritar"
          >
            <Star size={18} className={p.favorite ? 'fill-amber-400 text-amber-400' : ''} />
          </button>
        </div>

        {/* Price */}
        <p className="text-xl font-bold text-emerald-600 my-2">
          {p.price ? fmtEuro(Number(p.price)) : '—'}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {houseTypeLabel && (
            <span className="text-xs bg-purple-50 text-purple-600 rounded-md px-2 py-0.5 border border-purple-100">
              {houseTypeLabel}
            </span>
          )}
          {p.area && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-500 rounded-md px-2 py-0.5 border border-gray-100">
              <Maximize2 size={10} />
              {p.area}m²
            </span>
          )}
          {p.rooms && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-500 rounded-md px-2 py-0.5 border border-gray-100">
              <BedDouble size={10} />
              {p.rooms} qts
            </span>
          )}
          {p.visited && (
            <span className="text-xs bg-emerald-50 text-emerald-600 rounded-md px-2 py-0.5 border border-emerald-100">
              ✓ Visitado
            </span>
          )}
          {p.rating > 0 && (
            <span className="text-xs bg-amber-50 text-amber-600 rounded-md px-2 py-0.5 border border-amber-100">
              {'★'.repeat(p.rating)}
            </span>
          )}
        </div>

        {/* Scheme badges — FHS detail + AHS tag */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-50">

          {/* Viability + FHS inline */}
          {bestStatus === 'green' && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                ✓ Viável
              </span>
            </div>
          )}

          {bestStatus === 'yellow' && (() => {
            // Pick the AIP that gives the best (lowest) FHS requirement
            const s = (sim.aip1.status === 'yellow' && sim.aip2.status !== 'green')
              ? sim.aip1
              : sim.aip2.status === 'yellow'
              ? sim.aip2
              : sim.aip1;
            return (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                  ⚠ FHS Necessário
                </span>
                {s.fhsDetail.fhsRequired > 0 && (
                  <span className="text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    {fmtEuro(s.fhsDetail.fhsRequired)}
                    <span className="ml-1 font-normal opacity-80">
                      ({(s.fhsDetail.fhsPct * 100).toFixed(0)}%)
                    </span>
                  </span>
                )}
              </div>
            );
          })()}

          {bestStatus === 'red' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200 w-fit">
              ✕ Inviável
            </span>
          )}

          {/* Affordable Scheme tag */}
          {p.isAffordableScheme && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 w-fit">
              🏛️ Affordable Scheme
            </span>
          )}
        </div>

        {/* Edit button */}
        <div className="flex justify-end mt-2">
          <button
            className="text-xs text-gray-400 hover:text-emerald-600 transition-colors font-medium"
            onClick={(e) => { e.stopPropagation(); onEdit(p); }}
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
