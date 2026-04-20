// src/app/developments/page.tsx
'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, FileText, Building2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Development } from '@/types';
import {
  Button,
  Input,
  Textarea,
  FormField,
  Modal,
  SectionHeader,
  EmptyState,
} from '@/components/ui';

// ─── Form ────────────────────────────────────────────────────────────────────

type DevDraft = Omit<Development, 'id' | 'createdAt'>;
const emptyDraft: DevDraft = { name: '', city: '', website: '', brochureUrl: '', imageUrl: '' };

function DevelopmentForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Development;
  onSave: (d: DevDraft) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<DevDraft>(initial ? { ...emptyDraft, ...initial } : emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof DevDraft, string>>>({});

  const set = <K extends keyof DevDraft>(k: K, v: DevDraft[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Nome obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <Modal title={initial ? 'Editar Empreendimento' : 'Novo Empreendimento'} onClose={onClose} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Nome do Empreendimento">
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Parkside Court"
            />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
          </FormField>
        </div>
        <FormField label="Cidade">
          <Input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Ex: Dublin 15"
          />
        </FormField>
        <FormField label="Website">
          <Input
            type="url"
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://..."
          />
        </FormField>
        <FormField label="Brochura (URL do PDF)" hint="Link direto para o PDF da brochura">
          <Input
            type="url"
            value={form.brochureUrl || ''}
            onChange={(e) => set('brochureUrl', e.target.value)}
            placeholder="https://..."
          />
        </FormField>
        <FormField label="Imagem / Logo (URL)">
          <Input
            type="url"
            value={form.imageUrl || ''}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://..."
          />
        </FormField>
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DevelopmentsPage() {
  const { developments, properties, addDevelopment, updateDevelopment, deleteDevelopment } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Development | undefined>();

  const handleSave = (d: DevDraft) => {
    if (editTarget) updateDevelopment({ ...editTarget, ...d });
    else addDevelopment(d);
    setShowForm(false);
    setEditTarget(undefined);
  };

  const handleDelete = (dev: Development) => {
    const linked = properties.filter((p) => p.developmentId === dev.id).length;
    const msg = linked > 0
      ? `Remover "${dev.name}"? ${linked} imóvel(is) vinculado(s) serão desvinculados (não excluídos).`
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
          description="Crie um empreendimento para agrupar imóveis de um mesmo condomínio ou desenvolvimento."
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus size={15} /> Criar empreendimento
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {developments.map((dev) => {
            const linked = properties.filter((p) => p.developmentId === dev.id);
            return (
              <div key={dev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Image */}
                {dev.imageUrl ? (
                  <div className="w-full h-32 bg-gray-100 overflow-hidden">
                    <img src={dev.imageUrl} alt={dev.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.className = 'w-full h-32 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center'; }} />
                  </div>
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <Building2 size={32} className="text-blue-300" />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-0.5">{dev.name}</h3>
                  {dev.city && <p className="text-xs text-gray-400 mb-2">{dev.city}</p>}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-md px-2 py-0.5">
                      {linked.length} imóvel(is)
                    </span>
                    {dev.website && (
                      <a href={dev.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}>
                        <ExternalLink size={10} /> Website
                      </a>
                    )}
                    {dev.brochureUrl && (
                      <a href={dev.brochureUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}>
                        <FileText size={10} /> Brochura
                      </a>
                    )}
                  </div>

                  {/* Linked properties */}
                  {linked.length > 0 && (
                    <div className="mb-3 bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-semibold">Imóveis</p>
                      {linked.map((prop) => (
                        <p key={prop.id} className="text-xs text-gray-600 truncate">
                          • {prop.name} {prop.price ? `— €${Number(prop.price).toLocaleString('pt-BR')}` : ''}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(dev)}>
                      <Trash2 size={13} />
                    </Button>
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
    </div>
  );
}
