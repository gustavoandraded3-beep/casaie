// src/app/affordable/page.tsx
'use client';

import React, { useState } from 'react';
import {
  Plus, Trash2, Pencil, ChevronDown, ChevronUp,
  CheckCircle, Clock, AlertTriangle, HelpCircle,
  Home, TrendingDown, Euro,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { calcAffordableEligibility, calcMonthlyPayment, fmtEuro, fmtEuro2 } from '@/lib/calculations';
import type {
  AffordableApplication, AffordableUpdate, Property,
  AffordableEligibilityStatus,
} from '@/types';
import {
  Button, Input, Textarea, Select, FormField,
  Modal, SectionHeader, EmptyState, StarRating,
} from '@/components/ui';
import clsx from 'clsx';
import { PropertyForm } from '@/components/properties/PropertyForm';

// ─── Eligibility config ───────────────────────────────────────────────────────

const eligibilityConfig: Record<AffordableEligibilityStatus, {
  bg: string; border: string; text: string; icon: React.ReactNode; label: string;
}> = {
  eligible:   { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle size={15} />, label: 'Elegível' },
  borderline: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon: <AlertTriangle size={15} />, label: 'Borderline' },
  ineligible: { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     icon: <AlertTriangle size={15} />, label: 'Inelegível' },
  incomplete: { bg: 'bg-gray-50',    border: 'border-gray-200',    text: 'text-gray-500',    icon: <HelpCircle size={15} />, label: 'Dados incompletos' },
};

// ─── Update modal ─────────────────────────────────────────────────────────────

type UpdateDraft = Omit<AffordableUpdate, 'id' | 'createdAt'>;

function UpdateModal({ initial, onSave, onClose }: {
  initial?: AffordableUpdate; onSave: (d: UpdateDraft) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<UpdateDraft>({
    date: initial?.date ?? new Date().toISOString().split('T')[0],
    hasResponse: initial?.hasResponse ?? false,
    comment: initial?.comment ?? '',
  });
  return (
    <Modal title={initial ? 'Editar atualização' : 'Nova atualização'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <FormField label="Data">
          <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
        </FormField>
        <div className={`rounded-xl border-2 p-4 transition-colors ${form.hasResponse ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-emerald-600"
              checked={form.hasResponse} onChange={(e) => setForm(f => ({ ...f, hasResponse: e.target.checked }))} />
            <div>
              <span className="text-sm font-semibold text-gray-800">Recebeu resposta da autarquia</span>
              <p className="text-xs text-gray-500 mt-0.5">Marque se houve contacto da autarquia</p>
            </div>
          </label>
        </div>
        <FormField label="Comentários / Notas">
          <Textarea rows={4} value={form.comment}
            onChange={(e) => setForm(f => ({ ...f, comment: e.target.value }))}
            placeholder="Ex: Posição na lista de espera: 42. Aguardar contacto..." />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={() => { if (form.comment.trim() || form.hasResponse) onSave(form); }}>
          {initial ? 'Guardar' : 'Adicionar'}
        </Button>
      </div>
    </Modal>
  );
}

// ─── New application modal ────────────────────────────────────────────────────

function NewApplicationModal({ property, onSave, onClose }: {
  property: Property; onSave: (date: string) => void; onClose: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  return (
    <Modal title={`Registar candidatura — ${property.name}`} onClose={onClose}>
      <FormField label="Data de candidatura" hint="Quando submeteu a candidatura à autarquia">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </FormField>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(date)}>Registar candidatura</Button>
      </div>
    </Modal>
  );
}

// ─── Property card for affordable tab ────────────────────────────────────────

function AffordablePropertyCard({ property: p, app, onEdit }: {
  property: Property;
  app?: AffordableApplication;
  onEdit: (p: Property) => void;
}) {
  const {
    fin, addAffordableApplication, deleteAffordableApplication,
    addAffordableUpdate, updateAffordableUpdate, deleteAffordableUpdate,
    updateApplicationDate,
  } = useStore();

  const [showTimeline, setShowTimeline] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editUpdate, setEditUpdate] = useState<AffordableUpdate | undefined>();
  const [showNewApp, setShowNewApp] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [dateVal, setDateVal] = useState(app?.applicationDate ?? '');

  const d = p.affordableData ?? {};
  const elig = calcAffordableEligibility(p, fin);
  const cfg = eligibilityConfig[elig.status];
  const hasAnyResponse = app?.updates.some(u => u.hasResponse) ?? false;
  const lastUpdate = app?.updates.length ? app.updates[app.updates.length - 1] : null;

  const handleSaveUpdate = (draft: UpdateDraft) => {
    if (!app) return;
    if (editUpdate) updateAffordableUpdate(app.id, { ...editUpdate, ...draft });
    else addAffordableUpdate(app.id, draft);
    setShowUpdateModal(false);
    setEditUpdate(undefined);
  };

  return (
    <div className="bg-white rounded-xl border border-violet-100 shadow-sm overflow-hidden">
      {/* Top eligibility stripe */}
      <div className={`h-1.5 ${elig.status === 'eligible' ? 'bg-emerald-400' : elig.status === 'borderline' ? 'bg-amber-400' : elig.status === 'ineligible' ? 'bg-red-400' : 'bg-gray-200'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900 text-base">{p.name}</h3>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-400">{p.city}</p>
            {p.rating > 0 && <StarRating value={p.rating} size={13} />}
          </div>
          <button className="text-xs text-gray-400 hover:text-violet-600 transition-colors shrink-0"
            onClick={() => onEdit(p)}>
            <Pencil size={14} />
          </button>
        </div>

        {/* Scheme data table */}
        {(d.openMarketValue || d.minSalePrice) ? (
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-3">Dados do Esquema</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {d.openMarketValue && (
                <div>
                  <p className="text-violet-400 mb-0.5">Open Market Value</p>
                  <p className="font-bold text-violet-900 text-sm">{fmtEuro(d.openMarketValue)}</p>
                </div>
              )}
              {d.minSalePrice && (
                <div>
                  <p className="text-violet-400 mb-0.5">Min Sale Price</p>
                  <p className="font-bold text-emerald-700 text-sm">{fmtEuro(d.minSalePrice)}</p>
                  <p className="text-violet-400">(melhor caso)</p>
                </div>
              )}
              {d.maxSalePrice && (
                <div>
                  <p className="text-violet-400 mb-0.5">Max Sale Price</p>
                  <p className="font-bold text-gray-700 text-sm">{fmtEuro(d.maxSalePrice)}</p>
                </div>
              )}
              {d.equityDiscountPct !== undefined && (
                <div>
                  <p className="text.violet-400 text-violet-400 mb-0.5">Equity Discount</p>
                  <p className="font-bold text-violet-900 text-sm">{d.equityDiscountPct}%</p>
                  {d.openMarketValue && (
                    <p className="text-violet-400">{fmtEuro(d.openMarketValue * d.equityDiscountPct / 100)} da autarquia</p>
                  )}
                </div>
              )}
              {d.berRating && (
                <div>
                  <p className="text-violet-400 mb-0.5">BER Rating</p>
                  <p className="font-bold text-violet-900">{d.berRating}</p>
                </div>
              )}
              {d.unitsAvailable !== undefined && (
                <div>
                  <p className="text-violet-400 mb-0.5">Unidades disponíveis</p>
                  <p className="font-bold text-violet-900">{d.unitsAvailable}</p>
                </div>
              )}
            </div>

            {/* Savings from scheme */}
            {d.openMarketValue && d.minSalePrice && (
              <div className="mt-3 pt-3 border-t border-violet-200 flex items-center gap-2">
                <TrendingDown size={13} className="text-emerald-500 shrink-0" />
                <span className="text-xs text-emerald-700 font-medium">
                  Poupança máxima:{' '}
                  <strong>{fmtEuro(d.openMarketValue - d.minSalePrice)}</strong>
                  {' '}({(((d.openMarketValue - d.minSalePrice) / d.openMarketValue) * 100).toFixed(1)}% abaixo do mercado)
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-4 text-xs text-violet-500 italic">
            Edite o imóvel e preencha os dados do esquema para ver a análise de elegibilidade.
          </div>
        )}

        {/* Eligibility calculation */}
        {elig.status !== 'incomplete' && (
          <div className={`rounded-xl border p-4 mb-4 ${cfg.bg} ${cfg.border}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${cfg.text}`}>
              Análise de Elegibilidade
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-gray-500 mb-0.5">Preço a financiar (min)</p>
                <p className="font-bold text-gray-900 text-sm">{fmtEuro(elig.purchasePrice)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Seus fundos totais</p>
                <p className="font-bold text-gray-900 text-sm">{fmtEuro(elig.totalBuyerFunds)}</p>
                <p className="text-gray-400">AIP + Poupança + HTB</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">
                  {elig.shortfall > 0 ? 'Falta' : 'Sobra'}
                </p>
                <p className={`font-bold text-sm ${elig.shortfall > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {fmtEuro(Math.abs(elig.shortfall))}
                </p>
              </div>

              {/* Monthly payments */}
              {fin.aip1Value > 0 && elig.monthlyPayment1 > 0 && (
                <div>
                  <p className="text-gray-500 mb-0.5">Prestação {fin.aip1Bank || 'AIP1'}</p>
                  <p className="font-bold text-emerald-700 text-sm">{fmtEuro(elig.monthlyPayment1)}/mês</p>
                </div>
              )}
              {fin.aip2Value > 0 && elig.monthlyPayment2 > 0 && (
                <div>
                  <p className="text-gray-500 mb-0.5">Prestação {fin.aip2Bank || 'AIP2'}</p>
                  <p className="font-bold text-emerald-700 text-sm">{fmtEuro(elig.monthlyPayment2)}/mês</p>
                </div>
              )}

              {/* Equity explanation */}
              {elig.equityAmount > 0 && (
                <div>
                  <p className="text-gray-500 mb-0.5">Equity da autarquia</p>
                  <p className="font-bold text-violet-700 text-sm">{fmtEuro(elig.equityAmount)}</p>
                  <p className="text-gray-400">({d.equityDiscountPct}% do OMV)</p>
                </div>
              )}
            </div>

            {/* Status explanation */}
            <div className={`mt-3 pt-3 border-t ${elig.status === 'eligible' ? 'border-emerald-200' : elig.status === 'borderline' ? 'border-amber-200' : 'border-red-200'}`}>
              <p className={`text-xs font-medium ${cfg.text}`}>
                {elig.status === 'eligible' &&
                  '✓ Os seus fundos cobrem o preço mínimo de venda. Pode avançar com a candidatura.'}
                {elig.status === 'borderline' &&
                  '⚠ Os seus fundos ficam abaixo do preço mínimo mas dentro de uma margem razoável. Verifique com a autarquia.'}
                {elig.status === 'ineligible' &&
                  '✕ Os seus fundos actuais não chegam para o preço mínimo de venda. Precisaria aumentar o AIP ou poupança.'}
              </p>
            </div>
          </div>
        )}

        {/* Application status */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">Candidatura</span>
              {app ? (
                hasAnyResponse
                  ? <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5"><CheckCircle size={10} /> Com resposta</span>
                  : <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5"><Clock size={10} /> Aguardando</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Não registada</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {app && (
                <Button size="sm" variant="primary" onClick={() => { setEditUpdate(undefined); setShowUpdateModal(true); }}>
                  <Plus size={12} /> Atualização
                </Button>
              )}
              {!app && (
                <Button size="sm" variant="secondary" onClick={() => setShowNewApp(true)}>
                  <Plus size={12} /> Registar candidatura
                </Button>
              )}
              {app && (
                <button className="p-1.5 text-gray-300 hover:text-gray-600 transition-colors"
                  onClick={() => setShowTimeline(v => !v)}>
                  {showTimeline ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              )}
              {app && (
                <button className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                  onClick={() => {
                    if (confirm('Remover candidatura e todo o histórico?'))
                      deleteAffordableApplication(app.id);
                  }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Application date */}
          {app && (
            <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-500 flex items-center gap-2">
              <span>Candidatura em:</span>
              {editingDate ? (
                <span className="flex items-center gap-1.5">
                  <Input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)}
                    className="text-xs py-0.5 px-2 h-6 w-32" />
                  <Button size="sm" variant="primary" onClick={() => { updateApplicationDate(app.id, dateVal); setEditingDate(false); }}>OK</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDate(false)}>✕</Button>
                </span>
              ) : (
                <span>
                  <strong>{app.applicationDate ? new Date(app.applicationDate + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</strong>
                  <button className="ml-1 text-gray-300 hover:text-violet-500" onClick={() => setEditingDate(true)}><Pencil size={10} /></button>
                </span>
              )}
              {lastUpdate && (
                <span className="ml-auto text-gray-400">
                  Último update: {new Date(lastUpdate.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          )}

          {/* Timeline */}
          {app && showTimeline && (
            <div className="border-t border-gray-100 px-4 py-4">
              {app.updates.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-3">
                  Nenhuma atualização. Clique em "+ Atualização" para começar.
                </p>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-1 bottom-1 w-px bg-violet-100" />
                  <div className="space-y-3">
                    {[...app.updates].reverse().map((u) => (
                      <div key={u.id} className="flex gap-3 relative group">
                        <div className={clsx(
                          'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 mt-0.5',
                          u.hasResponse ? 'bg-emerald-100 border-emerald-400' : 'bg-gray-100 border-gray-300'
                        )}>
                          {u.hasResponse ? <CheckCircle size={11} className="text-emerald-600" /> : <Clock size={10} className="text-gray-400" />}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-gray-600">
                              {new Date(u.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                              {u.hasResponse && <span className="ml-2 text-emerald-600 font-medium">✓ Resposta</span>}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-0.5 text-gray-400 hover:text-violet-600"
                                onClick={() => { setEditUpdate(u); setShowUpdateModal(true); }}><Pencil size={11} /></button>
                              <button className="p-0.5 text-gray-400 hover:text-red-500"
                                onClick={() => { if (confirm('Remover?')) deleteAffordableUpdate(app.id, u.id); }}><Trash2 size={11} /></button>
                            </div>
                          </div>
                          {u.comment && <p className="text-xs text-gray-700 mt-1.5 whitespace-pre-wrap">{u.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUpdateModal && (
        <UpdateModal initial={editUpdate} onSave={handleSaveUpdate}
          onClose={() => { setShowUpdateModal(false); setEditUpdate(undefined); }} />
      )}
      {showNewApp && app === undefined && (
        <NewApplicationModal property={p}
          onSave={(date) => { addAffordableApplication(p.id, date); setShowNewApp(false); setShowTimeline(true); }}
          onClose={() => setShowNewApp(false)} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AffordablePage() {
  const { properties, affordableApplications, addProperty, updateProperty, deleteProperty } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | undefined>();

  const affordableProps = properties.filter(p => p.isAffordableScheme);

  const handleSave = (draft: Omit<Property, 'id' | 'createdAt'>) => {
    if (editTarget) updateProperty({ ...editTarget, ...draft });
    else addProperty(draft);
    setShowForm(false);
    setEditTarget(undefined);
  };

  return (
    <div>
      <SectionHeader
        title="Affordable Housing Scheme"
        subtitle={`${affordableProps.length} imóvel(is) · ${affordableApplications.length} candidatura(s)`}
        action={
          <Button variant="primary" onClick={() => { setEditTarget(undefined); setShowForm(true); }}>
            <Plus size={14} /> Adicionar imóvel AHS
          </Button>
        }
      />

      {affordableProps.length === 0 ? (
        <EmptyState
          icon="🏛️"
          title="Nenhum imóvel do Affordable Housing Scheme"
          description="Adicione um imóvel e marque a opção Affordable Housing Scheme para aparecer aqui."
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Adicionar imóvel AHS
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {affordableProps.map(p => (
            <AffordablePropertyCard
              key={p.id}
              property={p}
              app={affordableApplications.find(a => a.propertyId === p.id)}
              onEdit={(prop) => { setEditTarget(prop); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PropertyForm
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(undefined); }}
        />
      )}
    </div>
  );
}
