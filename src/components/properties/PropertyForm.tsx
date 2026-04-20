// src/components/properties/PropertyForm.tsx
'use client';

import React, { useState, useRef } from 'react';
import type { Property, HouseType } from '@/types';
import { HOUSE_TYPE_LABELS } from '@/types';
import { useStore } from '@/lib/store';
import {
  Modal, Button, Input, Textarea, Select, FormField, StarRating,
} from '@/components/ui';
import { Upload, X } from 'lucide-react';

type PropertyDraft = Omit<Property, 'id' | 'createdAt'>;

const IRISH_COUNTIES = [
  'Carlow','Cavan','Clare','Cork','Donegal','Dublin','Galway','Kerry',
  'Kildare','Kilkenny','Laois','Leitrim','Limerick','Longford','Louth',
  'Mayo','Meath','Monaghan','Offaly','Roscommon','Sligo','Tipperary',
  'Waterford','Westmeath','Wexford','Wicklow',
];

const empty: PropertyDraft = {
  name: '', city: '', county: '', website: '',
  area: '', rooms: '', price: '',
  visitDate: '', visited: false,
  pros: '', cons: '', rating: 0, favorite: false,
  houseType: '', developmentId: undefined,
  brochureUrl: '', imageUrl: '', plotNumber: '',
  eircode: '', trainStation: '', trainMinutesToDublin: '',
  isAffordableScheme: false,
};

interface Props {
  initial?: Property;
  onSave: (draft: PropertyDraft) => void;
  onClose: () => void;
}

export function PropertyForm({ initial, onSave, onClose }: Props) {
  const { developments } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PropertyDraft>(
    initial ? { ...empty, ...initial } : empty
  );
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyDraft, string>>>({});
  const [imagePreview, setImagePreview] = useState<string>(initial?.imageUrl || '');
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof PropertyDraft>(k: K, v: PropertyDraft[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Derived: selected development for inheritance
  const selectedDev = form.developmentId
    ? developments.find(d => d.id === form.developmentId)
    : null;
  const isLinked = !!selectedDev;
  const effectiveCounty  = selectedDev?.county    || '';
  const effectiveCity    = selectedDev?.city      || '';
  const effectiveEircode = selectedDev?.eircode   || '';

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Nome obrigatório';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Preço obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo 2MB.');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
      set('imageUrl', base64);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview('');
    set('imageUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal title={initial ? 'Editar Imóvel' : 'Novo Imóvel'} onClose={onClose} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Nome */}
        <div className="sm:col-span-2">
          <FormField label="Nome / Identificação da Casa">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: The Heather — Meadow Mill" />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
          </FormField>
        </div>

        {/* Tipo de Casa */}
        <FormField label="Tipo de Casa">
          <Select value={form.houseType || ''} onChange={(e) => set('houseType', e.target.value as HouseType)}>
            <option value="">Selecionar tipo...</option>
            {Object.entries(HOUSE_TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </Select>
        </FormField>

        {/* Empreendimento */}
        <FormField label="Empreendimento" hint="Opcional">
          <Select
            value={form.developmentId || ''}
            onChange={(e) => set('developmentId', e.target.value || undefined)}
          >
            <option value="">Standalone (sem empreendimento)</option>
            {developments.map((d) => (
              <option key={d.id} value={d.id}>{d.name} — {d.city}</option>
            ))}
          </Select>
        </FormField>

        {/* Condado — herdado ou editável */}
        <FormField label="Condado">
          {isLinked ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
              <span>📍 {effectiveCounty || 'Não definido no empreendimento'}</span>
              <span className="text-xs text-blue-400 ml-auto">do empreendimento</span>
            </div>
          ) : (
            <Select value={form.county || ''} onChange={(e) => set('county', e.target.value)}>
              <option value="">Selecionar condado...</option>
              {IRISH_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          )}
        </FormField>

        {/* Cidade — herdada ou editável */}
        <FormField label="Cidade / Localização">
          {isLinked ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
              <span>🏙 {effectiveCity || 'Não definido'}</span>
              <span className="text-xs text-blue-400 ml-auto">do empreendimento</span>
            </div>
          ) : (
            <Input value={form.city} onChange={(e) => set('city', e.target.value)}
              placeholder="Ex: Naas, Sallins..." />
          )}
        </FormField>

        {/* Eircode — herdado ou editável */}
        <FormField label="Eircode aproximado">
          {isLinked ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
              <span>{effectiveEircode || 'Não definido'}</span>
              <span className="text-xs text-blue-400 ml-auto">do empreendimento</span>
            </div>
          ) : (
            <Input value={form.eircode || ''}
              onChange={(e) => set('eircode', e.target.value.toUpperCase())}
              placeholder="W91 AB12" maxLength={8} />
          )}
        </FormField>

        {/* Nº da Casa na Planta */}
        <FormField label="Nº da Casa na Planta" hint="Número do lote conforme a planta do empreendimento">
          <Input
            value={form.plotNumber || ''}
            onChange={(e) => set('plotNumber', e.target.value)}
            placeholder="Ex: 12, B4, Lote 7..."
          />
        </FormField>

        {/* Área */}
        <FormField label="Tamanho (m²)">
          <Input type="number" min={0} value={form.area}
            onChange={(e) => set('area', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="85" />
        </FormField>

        {/* Quartos — 3 ou 4 */}
        <FormField label="Quartos">
          <Select
            value={form.rooms === '' ? '' : String(form.rooms)}
            onChange={(e) => set('rooms', e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Selecionar...</option>
            <option value="3">3 quartos</option>
            <option value="4">4 quartos</option>
          </Select>
        </FormField>

        {/* Valor */}
        <div className="sm:col-span-2">
          <FormField label="Valor (€)">
            <Input type="number" min={0} value={form.price}
              onChange={(e) => set('price', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="380000" />
            {errors.price && <p className="text-xs text-red-500 mt-0.5">{errors.price}</p>}
          </FormField>
        </div>

        {/* Data da visita */}
        <FormField label="Data da Visita (Open Viewing)">
          <Input type="date" value={form.visitDate}
            onChange={(e) => set('visitDate', e.target.value)} />
        </FormField>

        {/* Visitado */}
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              checked={form.visited}
              onChange={(e) => set('visited', e.target.checked)}
            />
            <span className="text-sm text-gray-700">Já visitei este imóvel</span>
          </label>
        </div>

        {/* Planta / Imagem da Casa — upload */}
        <div className="sm:col-span-2">
          <FormField label="Planta / Imagem da Casa" hint="Upload de imagem (máx. 2MB — JPG, PNG, WebP)">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Planta"
                  className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-gray-50" />
                <button type="button" onClick={removeImage}
                  className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500">
                  {uploading ? 'A carregar...' : 'Clique para fazer upload da planta ou imagem'}
                </span>
                <span className="text-xs text-gray-400">JPG, PNG, WebP — máx. 2MB</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*"
              className="hidden" onChange={handleImageUpload} />
          </FormField>
        </div>

        {/* Pontos Positivos */}
        <div className="sm:col-span-2">
          <FormField label="Pontos Positivos">
            <Textarea rows={3} value={form.pros}
              onChange={(e) => set('pros', e.target.value)}
              placeholder="O que você gostou do imóvel..." />
          </FormField>
        </div>

        {/* Pontos Negativos */}
        <div className="sm:col-span-2">
          <FormField label="Pontos Negativos">
            <Textarea rows={3} value={form.cons}
              onChange={(e) => set('cons', e.target.value)}
              placeholder="O que preocupou ou não gostou..." />
          </FormField>
        </div>

        {/* Avaliação */}
        <FormField label="Avaliação">
          <StarRating value={form.rating} onChange={(v) => set('rating', v)} size={24} />
        </FormField>

        {/* Favorito */}
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              checked={form.favorite}
              onChange={(e) => set('favorite', e.target.checked)}
            />
            <span className="text-sm text-gray-700">⭐ Marcar como favorito</span>
          </label>
        </div>

        {/* Affordable Housing Scheme */}
        <div className="sm:col-span-2">
          <div className={`rounded-xl border-2 transition-colors ${
            form.isAffordableScheme ? 'border-violet-300 bg-violet-50' : 'border-gray-100 bg-gray-50'
          }`}>
            <div className="p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  checked={!!form.isAffordableScheme}
                  onChange={(e) => set('isAffordableScheme', e.target.checked)}
                />
                <div>
                  <span className="text-sm font-semibold text-gray-800">🏛️ Affordable Housing Scheme</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Marque se este imóvel faz parte do esquema da autarquia local.
                  </p>
                </div>
              </label>
            </div>

            {form.isAffordableScheme && (
              <div className="border-t border-violet-200 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField label="Open Market Value (€)" hint="Valor real de mercado">
                  <Input type="number" min={0}
                    value={form.affordableData?.openMarketValue ?? ''}
                    onChange={(e) => set('affordableData', { ...form.affordableData, openMarketValue: Number(e.target.value) || undefined })}
                    placeholder="Ex: 390000" />
                </FormField>
                <FormField label="Min Sale Price (€)" hint="Preço mínimo (desconto máximo)">
                  <Input type="number" min={0}
                    value={form.affordableData?.minSalePrice ?? ''}
                    onChange={(e) => set('affordableData', { ...form.affordableData, minSalePrice: Number(e.target.value) || undefined })}
                    placeholder="Ex: 312000" />
                </FormField>
                <FormField label="Max Sale Price (€)" hint="Preço máximo (desconto mínimo)">
                  <Input type="number" min={0}
                    value={form.affordableData?.maxSalePrice ?? ''}
                    onChange={(e) => set('affordableData', { ...form.affordableData, maxSalePrice: Number(e.target.value) || undefined })}
                    placeholder="Ex: 370500" />
                </FormField>
                <FormField label="Equity Discount (%)" hint="% que a autarquia fica">
                  <Input type="number" min={0} max={100} step="0.01"
                    value={form.affordableData?.equityDiscountPct ?? ''}
                    onChange={(e) => set('affordableData', { ...form.affordableData, equityDiscountPct: Number(e.target.value) || undefined })}
                    placeholder="Ex: 20" />
                </FormField>
                <FormField label="BER Rating">
                  <Input value={form.affordableData?.berRating ?? ''}
                    onChange={(e) => set('affordableData', { ...form.affordableData, berRating: e.target.value || undefined })}
                    placeholder="Ex: A2" />
                </FormField>
                <FormField label="Unidades disponíveis">
                  <Input type="number" min={0}
                    value={form.affordableData?.unitsAvailable ?? ''}
                    onChange={(e) => set('affordableData', { ...form.affordableData, unitsAvailable: Number(e.target.value) || undefined })}
                    placeholder="Ex: 4" />
                </FormField>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={() => { if (validate()) onSave(form); }}>
          {initial ? 'Salvar alterações' : 'Adicionar imóvel'}
        </Button>
      </div>
    </Modal>
  );
}
