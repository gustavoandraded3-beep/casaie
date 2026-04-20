// src/components/properties/PropertyForm.tsx
'use client';

import React, { useState } from 'react';
import type { Property, HouseType } from '@/types';
import { HOUSE_TYPE_LABELS } from '@/types';
import { useStore } from '@/lib/store';
import {
  Modal,
  Button,
  Input,
  Textarea,
  Select,
  FormField,
  StarRating,
} from '@/components/ui';

type PropertyDraft = Omit<Property, 'id' | 'createdAt'>;

const empty: PropertyDraft = {
  name: '',
  city: '',
  website: '',
  area: '',
  rooms: '',
  price: '',
  visitDate: '',
  visited: false,
  pros: '',
  cons: '',
  rating: 0,
  favorite: false,
  houseType: '',
  developmentId: undefined,
  brochureUrl: '',
  imageUrl: '',
  isAffordableScheme: false,
};

interface Props {
  initial?: Property;
  onSave: (draft: PropertyDraft) => void;
  onClose: () => void;
}

export function PropertyForm({ initial, onSave, onClose }: Props) {
  const { developments } = useStore();

  const [form, setForm] = useState<PropertyDraft>(
    initial ? { ...empty, ...initial } : empty
  );
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyDraft, string>>>({});

  const set = <K extends keyof PropertyDraft>(k: K, v: PropertyDraft[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Nome obrigatório';
    if (!form.price || Number(form.price) <= 0) errs.price = 'Preço obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  return (
    <Modal
      title={initial ? 'Editar Imóvel' : 'Novo Imóvel'}
      onClose={onClose}
      wide
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ── Identification ── */}
        <div className="sm:col-span-2">
          <FormField label="Nome / Identificação da Casa">
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Lote 12 — Parkside Court"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>
            )}
          </FormField>
        </div>

        {/* Tipo de casa (new v2) */}
        <FormField label="Tipo de Casa">
          <Select
            value={form.houseType || ''}
            onChange={(e) => set('houseType', e.target.value as HouseType)}
          >
            <option value="">Selecionar tipo...</option>
            {Object.entries(HOUSE_TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </Select>
        </FormField>

        {/* Link to development (new v2) */}
        <FormField label="Empreendimento" hint="Opcional — deixe em branco para standalone">
          <Select
            value={form.developmentId || ''}
            onChange={(e) =>
              set('developmentId', e.target.value || undefined)
            }
          >
            <option value="">Standalone (sem empreendimento)</option>
            {developments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.city}
              </option>
            ))}
          </Select>
        </FormField>

        {/* City */}
        <FormField label="Cidade / Localização">
          <Input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Ex: Dublin 15"
          />
        </FormField>

        {/* Website */}
        <FormField label="Website">
          <Input
            type="url"
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://..."
          />
        </FormField>

        {/* Area */}
        <FormField label="Tamanho (m²)">
          <Input
            type="number"
            min={0}
            value={form.area}
            onChange={(e) =>
              set('area', e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="85"
          />
        </FormField>

        {/* Rooms */}
        <FormField label="Quartos">
          <Input
            type="number"
            min={0}
            value={form.rooms}
            onChange={(e) =>
              set('rooms', e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="3"
          />
        </FormField>

        {/* Price */}
        <div className="sm:col-span-2">
          <FormField label="Valor (€)">
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) =>
                set('price', e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="380000"
            />
            {errors.price && (
              <p className="text-xs text-red-500 mt-0.5">{errors.price}</p>
            )}
          </FormField>
        </div>

        {/* Visit date */}
        <FormField label="Data da Visita (Open Viewing)">
          <Input
            type="date"
            value={form.visitDate}
            onChange={(e) => set('visitDate', e.target.value)}
          />
        </FormField>

        {/* Visited checkbox */}
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              checked={form.visited}
              onChange={(e) => set('visited', e.target.checked)}
            />
            <span className="text-sm text-gray-700">Já visitei este imóvel</span>
          </label>
        </div>

        {/* Brochure URL (v2 — file upload placeholder, URL for now) */}
        <FormField label="Brochura (URL do PDF)" hint="Cole o link do PDF ou faça upload abaixo">
          <Input
            type="url"
            value={form.brochureUrl || ''}
            onChange={(e) => set('brochureUrl', e.target.value)}
            placeholder="https://... ou deixe em branco"
          />
        </FormField>

        {/* Image URL (v2) */}
        <FormField label="Imagem / Planta (URL)" hint="Link da imagem ou planta da casa">
          <Input
            type="url"
            value={form.imageUrl || ''}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://..."
          />
        </FormField>

        {/* Pros */}
        <div className="sm:col-span-2">
          <FormField label="Pontos Positivos">
            <Textarea
              rows={3}
              value={form.pros}
              onChange={(e) => set('pros', e.target.value)}
              placeholder="O que você gostou do imóvel..."
            />
          </FormField>
        </div>

        {/* Cons */}
        <div className="sm:col-span-2">
          <FormField label="Pontos Negativos">
            <Textarea
              rows={3}
              value={form.cons}
              onChange={(e) => set('cons', e.target.value)}
              placeholder="O que preocupou ou não gostou..."
            />
          </FormField>
        </div>

        {/* Rating */}
        <FormField label="Avaliação">
          <StarRating
            value={form.rating}
            onChange={(v) => set('rating', v)}
            size={24}
          />
        </FormField>

        {/* Favorite */}
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              checked={form.favorite}
              onChange={(e) => set('favorite', e.target.checked)}
            />
            <span className="text-sm text-gray-700">⭐ Marcar como favorito</span>
          </label>
        </div>

        {/* Affordable Housing Scheme */}
        <div className="sm:col-span-2">
          <div className={`rounded-xl border-2 transition-colors ${form.isAffordableScheme ? 'border-violet-300 bg-violet-50' : 'border-gray-100 bg-gray-50'}`}>
            {/* Toggle */}
            <div className="p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  checked={!!form.isAffordableScheme}
                  onChange={(e) => set('isAffordableScheme', e.target.checked)}
                />
                <div>
                  <span className="text-sm font-semibold text-gray-800">
                    🏛️ Affordable Housing Scheme
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Marque se este imóvel faz parte do esquema da autarquia. Preencha os dados da tabela de propriedades disponíveis para calcular a elegibilidade.
                  </p>
                </div>
              </label>
            </div>

            {/* Scheme data fields — only shown when checked */}
            {form.isAffordableScheme && (
              <div className="border-t border-violet-200 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField label="Open Market Value (€)" hint="Valor real no mercado livre">
                  <Input
                    type="number" min={0}
                    value={form.affordableData?.openMarketValue ?? ''}
                    onChange={(e) => set('affordableData', {
                      ...form.affordableData,
                      openMarketValue: Number(e.target.value) || undefined,
                    })}
                    placeholder="Ex: 390000"
                  />
                </FormField>

                <FormField label="Min Sale Price (€)" hint="Preço mínimo (desconto máximo)">
                  <Input
                    type="number" min={0}
                    value={form.affordableData?.minSalePrice ?? ''}
                    onChange={(e) => set('affordableData', {
                      ...form.affordableData,
                      minSalePrice: Number(e.target.value) || undefined,
                    })}
                    placeholder="Ex: 312000"
                  />
                </FormField>

                <FormField label="Max Sale Price (€)" hint="Preço máximo (desconto mínimo)">
                  <Input
                    type="number" min={0}
                    value={form.affordableData?.maxSalePrice ?? ''}
                    onChange={(e) => set('affordableData', {
                      ...form.affordableData,
                      maxSalePrice: Number(e.target.value) || undefined,
                    })}
                    placeholder="Ex: 370500"
                  />
                </FormField>

                <FormField label="Equity Discount (%)" hint="% que a autarquia fica">
                  <Input
                    type="number" min={0} max={100} step="0.01"
                    value={form.affordableData?.equityDiscountPct ?? ''}
                    onChange={(e) => set('affordableData', {
                      ...form.affordableData,
                      equityDiscountPct: Number(e.target.value) || undefined,
                    })}
                    placeholder="Ex: 20"
                  />
                </FormField>

                <FormField label="BER Rating">
                  <Input
                    value={form.affordableData?.berRating ?? ''}
                    onChange={(e) => set('affordableData', {
                      ...form.affordableData,
                      berRating: e.target.value || undefined,
                    })}
                    placeholder="Ex: A2"
                  />
                </FormField>

                <FormField label="Unidades disponíveis" hint="No of Homes">
                  <Input
                    type="number" min={0}
                    value={form.affordableData?.unitsAvailable ?? ''}
                    onChange={(e) => set('affordableData', {
                      ...form.affordableData,
                      unitsAvailable: Number(e.target.value) || undefined,
                    })}
                    placeholder="Ex: 4"
                  />
                </FormField>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave}>
          {initial ? 'Salvar alterações' : 'Adicionar imóvel'}
        </Button>
      </div>
    </Modal>
  );
}
