// src/app/developments/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Building2, Upload, X, Maximize2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Development } from '@/types';
import {
  Button, Input, Select, FormField, Modal, SectionHeader, EmptyState,
} from '@/components/ui';

const IRISH_COUNTIES = [
  'Carlow','Cavan','Clare','Cork','Donegal','Dublin','Galway','Kerry',
  'Kildare','Kilkenny','Laois','Leitrim','Limerick','Longford','Louth',
  'Mayo','Meath','Monaghan','Offaly','Roscommon','Sligo','Tipperary',
  'Waterford','Westmeath','Wexford','Wicklow',
];

// ─── Image upload helper ──────────────────────────────────────────────────────

function ImageUploadField({
  label, hint, value, onChange,
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('Imagem muito grande. Máximo 3MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => { onChange(ev.target?.result as string); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return (
    <FormField label={label} hint={hint}>
      {value ? (
        <div className="relative">
          <img src={value} alt={label} className="w-full max-h-40 object-contain rounded-xl border border-gray-200 bg-gray-50" />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-red-50 transition-colors">
            <X size={13} className="text-gray-500" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
          <Upload size={18} className="text-gray-400" />
          <span className="text-sm text-gray-500">{uploading ? 'A carregar...' : 'Clique para fazer upload'}</span>
          <span className="text-xs text-gray-400">JPG, PNG, WebP — máx. 3MB</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </FormField>
  );
}

// ─── Fullscreen image viewer ──────────────────────────────────────────────────

function ImageViewer({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center p-4"
      onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-medium">{title}</p>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>
        <img src={src} alt={title}
          className="w-full max-h-[80vh] object-contain rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

// ─── Development Form ─────────────────────────────────────────────────────────

type DevDraft = Omit<Development, 'id' | 'createdAt'>;

const emptyDraft: DevDraft = {
  name: '', city: '', county: '', website: '',
  brochureUrl: '', imageUrl: '', siteMapImage: '',
  eircode: '', trainStation: '', trainMinutesToDublin: '',
};

function DevelopmentForm({ initial, onSave, onClose }: {
  initial?: Development; onSave: (d: DevDraft) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<DevDraft>(initial ? { ...emptyDraft, ...initial } : emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof DevDraft, string>>>({});

  const set = <K extends keyof DevDraft>(k: K, v: DevDraft[K]) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Nome obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <Modal title={initial ? 'Editar Empreendimento' : 'Novo Empreendimento'} onClose={onClose} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Nome */}
        <div className="sm:col-span-2">
          <FormField label="Nome do Empreendimento">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Meadow Mill" />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
          </FormField>
        </div>

        {/* Condado */}
        <FormField label="Condado">
          <Select value={form.county || ''} onChange={(e) => set('county', e.target.value)}>
            <option value="">Selecionar condado...</option>
            {IRISH_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </FormField>

        {/* Cidade */}
        <FormField label="Cidade / Localização">
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Ex: Athy, Naas..." />
        </FormField>

        {/* Eircode */}
        <FormField label="Eircode aproximado" hint="Partilhado por todas as casas">
          <Input value={form.eircode || ''} onChange={(e) => set('eircode', e.target.value.toUpperCase())}
            placeholder="Ex: R14 AB12" maxLength={8} />
        </FormField>

        {/* Website */}
        <FormField label="Website">
          <Input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
        </FormField>

        {/* Estação */}
        <FormField label="Estação mais próxima" hint="Irish Rail / DART / Luas">
          <Input value={form.trainStation || ''} onChange={(e) => set('trainStation', e.target.value)}
            placeholder="Ex: Athy, Kildare, Newbridge..." />
        </FormField>

        {/* Tempo de trem */}
        <FormField label="Tempo de trem até Dublin (min)">
          <Input type="number" min={0} max={240}
            value={form.trainMinutesToDublin ?? ''}
            onChange={(e) => set('trainMinutesToDublin', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Ex: 55" />
        </FormField>

        {/* Planta do empreendimento */}
        <div className="sm:col-span-2">
          <ImageUploadField
            label="Planta do Empreendimento (Site Map)"
            hint="Mapa geral com a localização de todos os lotes"
            value={form.siteMapImage || ''}
            onChange={(v) => set('siteMapImage', v)}
          />
        </div>

        {/* Imagem / logo */}
        <div className="sm:col-span-2">
          <ImageUploadField
            label="Imagem / Logo do Empreendimento"
            hint="Foto ou imagem de capa"
            value={form.imageUrl || ''}
            onChange={(v) => set('imageUrl', v)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={() => { if (validate()) onSave(form); }}>
          {initial ? 'Salvar alterações' : 'Criar empreendimento'}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DevelopmentsPage() {
  const { developments, properties, addDevelopment, updateDevelopment, deleteDevelopment } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Development | undefined>();
  const [viewImage, setViewImage] = useState<{ src: string; title: string } | null>(null);

  const handleSave = (d: DevDraft) => {
    if (editTarget) updateDevelopment({ ...editTarget, ...d });
    else addDevelopment(d);
    setShowForm(false);
    setEditTarget(undefined);
  };

  const handleDelete = (dev: Development) => {
    const linked = properties.filter(p => p.developmentId === dev.id).length;
    const msg = linked > 0
      ? `Remover "${dev.name}"? ${linked} imóvel(is) serão desvinculados (não excluídos).`
      : `Remover "${dev.name}"?`;
    if (confirm(msg)) deleteDevelopment(dev.id);
  };

  return (
    <div>
      <SectionHeader
        title="Empreendimentos"
        subtitle={`${developments.length} empreendimento(s) cadastrado(s)`}
        action={
          <Button variant="primary" onClick={() => { setEditTarget(undefined); setShowForm(true); }}>
            <Plus size={15} /> Novo empreendimento
          </Button>
        }
      />

      {developments.length === 0 ? (
        <EmptyState
          icon="🏗️"
          title="Nenhum empreendimento cadastrado"
          description="Crie um empreendimento para agrupar imóveis e partilhar localização, transporte e planta."
          action={<Button variant="primary" onClick={() => setShowForm(true)}><Plus size={15} /> Criar empreendimento</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {developments.map((dev) => {
            const linked = properties.filter(p => p.developmentId === dev.id);
            return (
              <div key={dev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Cover image */}
                {dev.imageUrl ? (
                  <div className="w-full h-28 bg-gray-100 overflow-hidden">
                    <img src={dev.imageUrl} alt={dev.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-20 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <Building2 size={28} className="text-blue-300" />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{dev.name}</h3>
                  {(dev.city || dev.county) && (
                    <p className="text-xs text-gray-400 mb-1">{[dev.city, dev.county].filter(Boolean).join(', ')}</p>
                  )}
                  {dev.eircode && <p className="text-xs text-gray-400 mb-2">📍 {dev.eircode}</p>}

                  {/* Transport info */}
                  {dev.trainStation && (
                    <p className="text-xs text-gray-500 mb-2">
                      🚂 {dev.trainStation}{dev.trainMinutesToDublin ? ` · ${dev.trainMinutesToDublin} min` : ''}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-md px-2 py-0.5">
                      {linked.length} imóvel(is)
                    </span>
                    {dev.website && (
                      <a href={dev.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <ExternalLink size={10} /> Website
                      </a>
                    )}
                    {/* Site map button */}
                    {dev.siteMapImage && (
                      <button
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 hover:underline"
                        onClick={() => setViewImage({ src: dev.siteMapImage!, title: `Planta — ${dev.name}` })}>
                        <Maximize2 size={10} /> Ver planta
                      </button>
                    )}
                  </div>

                  {linked.length > 0 && (
                    <div className="mb-3 bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-semibold">Imóveis</p>
                      {linked.map(prop => (
                        <p key={prop.id} className="text-xs text-gray-600 truncate">
                          • {prop.name}{prop.plotNumber ? ` (Lote ${prop.plotNumber})` : ''}{prop.price ? ` — €${Number(prop.price).toLocaleString('pt-BR')}` : ''}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(dev)}><Trash2 size={13} /></Button>
                    <Button size="sm" variant="secondary" onClick={() => { setEditTarget(dev); setShowForm(true); }}>
                      <Pencil size={13} /> Editar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <DevelopmentForm
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(undefined); }}
        />
      )}

      {viewImage && (
        <ImageViewer src={viewImage.src} title={viewImage.title} onClose={() => setViewImage(null)} />
      )}
    </div>
  );
}
