// src/components/properties/PropertyDetail.tsx
'use client';

import React from 'react';
import { ExternalLink, Star, Pencil, Trash2, Building2, FileText, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import type { Property, StressResult } from '@/types';
import { HOUSE_TYPE_LABELS } from '@/types';
import { simulateProperty, fmtEuro, fmtPct } from '@/lib/calculations';
import { useStore } from '@/lib/store';
import {
  Modal,
  Button,
  StarRating,
  ViabilityBadge,
  MetricCard,
  Badge,
} from '@/components/ui';
import clsx from 'clsx';

interface Props {
  property: Property;
  onClose: () => void;
  onEdit: (p: Property) => void;
  onDelete: (id: string) => void;
}

const stressColors: Record<StressResult, string> = {
  aprovado:  'bg-emerald-50 border-emerald-200 text-emerald-700',
  risco:     'bg-amber-50 border-amber-200 text-amber-700',
  reprovado: 'bg-red-50 border-red-200 text-red-700',
};
const stressIcons: Record<StressResult, React.ReactNode> = {
  aprovado:  <CheckCircle size={14} />,
  risco:     <AlertCircle size={14} />,
  reprovado: <AlertTriangle size={14} />,
};
const stressLabels: Record<StressResult, string> = {
  aprovado:  'Aprovado',
  risco:     'Risco Moderado',
  reprovado: 'Reprovado',
};

export function PropertyDetail({ property: p, onClose, onEdit, onDelete }: Props) {
  const { fin, toggleFavorite, developments } = useStore();
  const sim = simulateProperty(p, fin);

  const dev = p.developmentId
    ? developments.find((d) => d.id === p.developmentId)
    : null;

  // Effective transport — inherited from dev when linked
  const effectiveStation = dev?.trainStation || p.trainStation;
  const effectiveTrain   = dev?.trainMinutesToDublin ?? p.trainMinutesToDublin;
  const effectiveEircode = dev?.eircode || p.eircode;
  const effectiveCity    = dev?.city || p.city;
  const effectiveCounty  = dev?.county || p.county;

  const [viewingImage, setViewingImage] = React.useState<string | null>(null);

  const houseTypeLabel = p.houseType
    ? HOUSE_TYPE_LABELS[p.houseType as keyof typeof HOUSE_TYPE_LABELS]
    : null;

  const handleDelete = () => {
    if (confirm(`Remover "${p.name}"? Esta ação não pode ser desfeita.`)) {
      onDelete(p.id);
      onClose();
    }
  };

  const aips = [
    { label: fin.aip1Bank || 'Banco 1', sim: sim.aip1 },
    { label: fin.aip2Bank || 'Banco 2', sim: sim.aip2 },
  ].filter((a) => a.sim.aipValue > 0);

  return (
    <Modal title="" onClose={onClose} wide>
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl text-gray-900 truncate" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {p.name}
            </h2>
            <button onClick={() => toggleFavorite(p.id)} className="text-gray-300 hover:text-amber-400 transition-colors shrink-0">
              <Star size={20} className={p.favorite ? 'fill-amber-400 text-amber-400' : ''} />
            </button>
          </div>
          {(effectiveCity || effectiveCounty) && (
            <p className="text-sm text-gray-400 mt-0.5">
              {[effectiveCity, effectiveCounty].filter(Boolean).join(', ')}
              {effectiveEircode && <span className="ml-2 text-gray-400">· {effectiveEircode}</span>}
            </p>
          )}
          {effectiveStation && (
            <p className="text-xs text-gray-400 mt-0.5">
              🚂 {effectiveStation}{effectiveTrain ? ` · ${effectiveTrain} min até Dublin` : ''}
            </p>
          )}

          {/* Development link */}
          {dev && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-2 py-1 w-fit">
              <Building2 size={11} />
              <span>{dev.name}</span>
              {dev.website && (
                <a href={dev.website} target="_blank" rel="noopener noreferrer"
                   className="hover:underline" onClick={(e) => e.stopPropagation()}>
                  ↗
                </a>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {p.isAffordableScheme && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                🏛️ Affordable Scheme
              </span>
            )}
            {houseTypeLabel && (
              <span className="text-xs bg-purple-50 text-purple-600 border border-purple-100 rounded-md px-2 py-0.5">
                {houseTypeLabel}
              </span>
            )}
            {p.website && (
              <a href={p.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}>
                <ExternalLink size={11} /> Website
              </a>
            )}
            {p.brochureUrl && (
              <a href={p.brochureUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline"
                onClick={(e) => e.stopPropagation()}>
                <FileText size={11} /> Brochura PDF
              </a>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-emerald-600">{p.price ? fmtEuro(Number(p.price)) : '—'}</p>
          <StarRating value={p.rating} size={16} />
        </div>
      </div>

      {/* Property image — clickable thumbnail */}
      {p.imageUrl && (
        <div
          className="w-full h-48 rounded-xl overflow-hidden bg-gray-100 mb-4 cursor-zoom-in relative group"
          onClick={() => setViewingImage(p.imageUrl!)}
        >
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
              🔍 Ver em tamanho real
            </span>
          </div>
        </div>
      )}

      {/* Site map button — from development */}
      {dev?.siteMapImage && (
        <button
          className="w-full mb-4 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 hover:bg-blue-100 transition-colors"
          onClick={() => setViewingImage(dev.siteMapImage!)}
        >
          <span>🗺️</span>
          <span className="font-medium">Ver planta do empreendimento</span>
          {p.plotNumber && (
            <span className="ml-auto text-xs bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">
              Lote {p.plotNumber}
            </span>
          )}
        </button>
      )}

      {/* Fullscreen image viewer */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 flex flex-col items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-3">
              <button onClick={() => setViewingImage(null)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            <img src={viewingImage} alt="Imagem" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Tamanho" value={p.area ? `${p.area}m²` : '—'} />
        <MetricCard label="Quartos"  value={p.rooms || '—'} />
        <MetricCard label="Data visita" value={p.visitDate || '—'} />
        <MetricCard label="Visitado" value={p.visited ? '✓ Sim' : 'Não'} color={p.visited ? 'green' : undefined} />
        {effectiveEircode && <MetricCard label="Eircode" value={effectiveEircode} />}
        {effectiveStation && <MetricCard label="Estação" value={effectiveStation} />}
        {effectiveTrain ? <MetricCard label="Trem p/ Dublin" value={`${effectiveTrain} min`} /> : null}
        {p.plotNumber && <MetricCard label="Nº na planta" value={p.plotNumber} />}
      </div>

      {/* Pros / Cons */}
      {(p.pros || p.cons) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {p.pros && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">✓ Pontos Positivos</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.pros}</p>
            </div>
          )}
          {p.cons && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">✕ Pontos Negativos</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Financial simulation ── */}
      <div className="border-t border-gray-100 pt-4 mb-4">
        <p className="text-base font-semibold text-gray-700 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Análise Financeira
        </p>

        {/* Deposit summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Depósito (10%)</p>
              <p className="font-semibold text-gray-900">{fmtEuro(sim.deposit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Seus fundos</p>
              <p className="font-semibold text-gray-900">{fmtEuro(sim.availableFunds)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{sim.depositGap > 0 ? 'Faltando' : 'Sobra'}</p>
              <p className={`font-semibold ${sim.depositGap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {fmtEuro(Math.abs(sim.depositGap))}
              </p>
            </div>
          </div>
        </div>

        {/* Per-AIP simulation */}
        {aips.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Configure seus AIPs no Dashboard Financeiro para ver a simulação.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aips.map(({ label, sim: s }) => (
              <div key={label} className={`rounded-xl p-4 border ${
                s.status === 'green' ? 'bg-emerald-50 border-emerald-200'
                : s.status === 'yellow' ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-800 text-sm">{label}</p>
                  <ViabilityBadge status={s.status} />
                </div>

                {/* FHS detail */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-gray-500 mb-0.5">AIP aprovado</p>
                    <p className="font-semibold text-gray-800">{fmtEuro(s.aipValue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">FHS necessário</p>
                    <p className="font-semibold text-gray-800">
                      {s.fhsDetail.fhsRequired > 0 ? fmtEuro(s.fhsDetail.fhsRequired) : 'Não precisa'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">FHS % do preço</p>
                    <p className={clsx('font-semibold', s.fhsDetail.fhsPct > s.fhsDetail.maxAllowedPct ? 'text-red-600' : 'text-gray-800')}>
                      {fmtPct(s.fhsDetail.fhsPct)}
                      <span className="text-gray-400 font-normal ml-1">(max {fmtPct(s.fhsDetail.maxAllowedPct)})</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Elegível FHS</p>
                    <p className={clsx('font-semibold', s.fhsDetail.eligible ? 'text-emerald-600' : 'text-red-600')}>
                      {s.fhsDetail.fhsRequired === 0 ? 'N/A' : s.fhsDetail.eligible ? '✓ Elegível' : '✕ Inelegível'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Capital total</p>
                    <p className="font-semibold text-gray-800">{fmtEuro(s.totalLoanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Prestação/mês</p>
                    <p className="font-bold text-emerald-700 text-sm">{fmtEuro(s.monthlyPayment)}</p>
                  </div>
                </div>

                {/* Stress test */}
                {s.stressTest && (
                  <div className={`rounded-lg border p-2.5 text-xs ${stressColors[s.stressTest.result]}`}>
                    <div className="flex items-center gap-1.5 font-semibold mb-1.5">
                      {stressIcons[s.stressTest.result]}
                      Stress Test: {stressLabels[s.stressTest.result]}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <span className="opacity-70">Taxa stress ({s.stressTest.stressRate}%)</span>
                      <span className="font-medium">{fmtEuro(s.stressTest.stressedMonthlyPayment)}/mês</span>
                      <span className="opacity-70">Máx. 35% da renda</span>
                      <span className="font-medium">{fmtEuro(s.stressTest.maxAffordablePayment)}/mês</span>
                    </div>
                  </div>
                )}
                {!s.stressTest && (
                  <p className="text-xs text-gray-400 italic">
                    Configure renda mensal no Dashboard para ver o stress test.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Button variant="danger" onClick={handleDelete}>
          <Trash2 size={14} /> Excluir
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
          <Button variant="primary" onClick={() => { onClose(); onEdit(p); }}>
            <Pencil size={14} /> Editar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
