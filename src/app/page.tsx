// src/app/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Plus, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { useStore } from '@/lib/store';
import { simulateProperty, fmtEuro, bestStatus } from '@/lib/calculations';
import type { Property } from '@/types';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { PropertyDetail } from '@/components/properties/PropertyDetail';
import {
  Button,
  Select,
  Input,
  SectionHeader,
  EmptyState,
  Badge,
  StarRating,
  ViabilityBadge,
} from '@/components/ui';
import clsx from 'clsx';

type SortKey = 'price_asc' | 'price_desc' | 'rating_desc' | 'rating_asc' | '';
type ViewMode = 'cards' | 'table';

export default function HomePage() {
  const { properties, fin, addProperty, updateProperty, deleteProperty } = useStore();

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterVisited, setFilterVisited] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterViability, setFilterViability] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [showFilters, setShowFilters] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | undefined>();
  const [viewTarget, setViewTarget] = useState<Property | undefined>();

  const cities = useMemo(
    () => [...new Set(properties.map((p) => p.city).filter(Boolean))].sort(),
    [properties]
  );

  const filtered = useMemo(() => {
    let list = properties
      .filter((p) => !p.isAffordableScheme) // Affordable homes live in their own tab
      .filter((p) => {
      if (
        search &&
        !`${p.name} ${p.city}`.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (filterCity && p.city !== filterCity) return false;
      if (filterVisited === 'sim' && !p.visited) return false;
      if (filterVisited === 'nao' && p.visited) return false;
      if (filterRating && p.rating < Number(filterRating)) return false;
      if (filterViability) {
        const sim = simulateProperty(p, fin);
        if (bestStatus(sim) !== filterViability) return false;
      }
      return true;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        if (sortKey === 'price_asc') return Number(a.price) - Number(b.price);
        if (sortKey === 'price_desc') return Number(b.price) - Number(a.price);
        if (sortKey === 'rating_desc') return b.rating - a.rating;
        if (sortKey === 'rating_asc') return a.rating - b.rating;
        return 0;
      });
    }

    // Always show favorites first within the sorted result
    return [...list.filter((p) => p.favorite), ...list.filter((p) => !p.favorite)];
  }, [properties, search, filterCity, filterVisited, filterRating, filterViability, sortKey, fin]);

  const openAdd = () => {
    setEditTarget(undefined);
    setShowForm(true);
  };

  const openEdit = (p: Property) => {
    setEditTarget(p);
    setShowForm(true);
  };

  const handleSave = (draft: Omit<Property, 'id' | 'createdAt'>) => {
    if (editTarget) {
      updateProperty({ ...editTarget, ...draft });
    } else {
      addProperty(draft);
    }
    setShowForm(false);
    setEditTarget(undefined);
  };

  const activeFilters = [filterCity, filterVisited, filterRating, filterViability].filter(Boolean).length;

  return (
    <div>
      <SectionHeader
        title="Meus Imóveis"
        subtitle={`${properties.filter(p => !p.isAffordableScheme).length} imóvel(is) · ${filtered.length} exibido(s) · Affordable Scheme na aba própria`}
        action={
          <Button variant="primary" onClick={openAdd}>
            <Plus size={15} />
            Adicionar imóvel
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Input
          placeholder="Buscar por nome ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <Button
          variant={showFilters || activeFilters > 0 ? 'primary' : 'secondary'}
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {activeFilters > 0 && (
            <span className="ml-1 bg-white text-emerald-700 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeFilters}
            </span>
          )}
        </Button>

        <Select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="max-w-[180px]"
        >
          <option value="">Ordenar...</option>
          <option value="price_asc">Preço: menor primeiro</option>
          <option value="price_desc">Preço: maior primeiro</option>
          <option value="rating_desc">Avaliação: maior primeiro</option>
          <option value="rating_asc">Avaliação: menor primeiro</option>
        </Select>

        <div className="ml-auto flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            className={clsx(
              'px-3 py-1.5 text-sm transition-colors',
              viewMode === 'cards'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            )}
            onClick={() => setViewMode('cards')}
            title="Cards"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            className={clsx(
              'px-3 py-1.5 text-sm transition-colors',
              viewMode === 'table'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            )}
            onClick={() => setViewMode('table')}
            title="Lista"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cidade</label>
            <Select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
              <option value="">Todas</option>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Visitado</label>
            <Select value={filterVisited} onChange={(e) => setFilterVisited(e.target.value)}>
              <option value="">Todos</option>
              <option value="sim">Visitado</option>
              <option value="nao">Não visitado</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avaliação mín.</label>
            <Select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
              <option value="">Qualquer</option>
              <option value="3">3+ estrelas</option>
              <option value="4">4+ estrelas</option>
              <option value="5">5 estrelas</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Viabilidade</label>
            <Select value={filterViability} onChange={(e) => setFilterViability(e.target.value)}>
              <option value="">Todas</option>
              <option value="green">Viável</option>
              <option value="yellow">FHS necessário</option>
              <option value="red">Inviável</option>
            </Select>
          </div>
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterCity('');
                setFilterVisited('');
                setFilterRating('');
                setFilterViability('');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {properties.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="Nenhum imóvel cadastrado ainda"
          description="Adicione o primeiro imóvel que você está considerando comprar."
          action={
            <Button variant="primary" onClick={openAdd}>
              <Plus size={15} />
              Adicionar imóvel
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nenhum imóvel encontrado"
          description="Tente ajustar os filtros ou a busca."
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              onView={setViewTarget}
              onEdit={openEdit}
            />
          ))}
        </div>
      ) : (
        <PropertyTable
          properties={filtered}
          fin={fin}
          onView={setViewTarget}
          onEdit={openEdit}
        />
      )}

      {/* Modals */}
      {showForm && (
        <PropertyForm
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(undefined); }}
        />
      )}
      {viewTarget && (
        <PropertyDetail
          property={viewTarget}
          onClose={() => setViewTarget(undefined)}
          onEdit={(p) => { setViewTarget(undefined); openEdit(p); }}
          onDelete={(id) => { deleteProperty(id); setViewTarget(undefined); }}
        />
      )}
    </div>
  );
}

// ─── Table view ──────────────────────────────────────────────────────────────

import type { FinancialConfig } from '@/types';

function PropertyTable({
  properties,
  fin,
  onView,
  onEdit,
}: {
  properties: Property[];
  fin: FinancialConfig;
  onView: (p: Property) => void;
  onEdit: (p: Property) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cidade</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Valor</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">m²</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Qts</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nota</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Visitado</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Viabilidade</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => {
              const sim = simulateProperty(p, fin);
              const status = bestStatus(sim);
              return (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onView(p)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    {p.favorite && <span className="ml-1 text-amber-400">★</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.city || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                    {p.price ? fmtEuro(Number(p.price)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{p.area || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{p.rooms || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {p.rating > 0 ? (
                      <span className="text-amber-400">{'★'.repeat(p.rating)}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.visited ? (
                      <span className="text-emerald-600 font-medium">✓</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ViabilityBadge status={status} />
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
