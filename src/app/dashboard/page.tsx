// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { simulateProperty, fmtEuro, fmtEuro2, calcMonthlyPayment, bestStatus } from '@/lib/calculations';
import {
  SectionHeader,
  MetricCard,
  Button,
  Input,
  Select,
  FormField,
  ViabilityBadge,
} from '@/components/ui';
import clsx from 'clsx';
import type { FinancialConfig, AIPDetail } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function DashboardPage() {
  const { fin, setFin, properties } = useStore();

  const set = <K extends keyof typeof fin>(k: K, v: (typeof fin)[K]) =>
    setFin({ ...fin, [k]: v });

  const totalFunds = (fin.savings || 0) + (fin.htb || 0);
  const maxBuyPower1 = (fin.aip1Value || 0) + totalFunds;
  const maxBuyPower2 = (fin.aip2Value || 0) + totalFunds;
  const bestBuyPower = Math.max(maxBuyPower1, maxBuyPower2);

  const monthly1 = calcMonthlyPayment(fin.aip1Value || 0, fin.interestRate || 4, fin.termYears || 30);
  const monthly2 = calcMonthlyPayment(fin.aip2Value || 0, fin.interestRate || 4, fin.termYears || 30);

  const viable = properties.filter((p) => {
    const sim = simulateProperty(p, fin);
    return bestStatus(sim) !== 'red';
  });

  const avgPrice = properties.length
    ? properties.reduce((s, p) => s + Number(p.price || 0), 0) / properties.length
    : 0;

  return (
    <div>
      <SectionHeader
        title="Dashboard Financeiro"
        subtitle="Configure seus recursos, aprovações e parâmetros da hipoteca"
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <MetricCard
          label="Fundos disponíveis"
          value={fmtEuro(totalFunds)}
          sub="Poupança + HTB"
          color="green"
        />
        <MetricCard
          label={`Poder de compra (${fin.aip1Bank || 'Banco 1'})`}
          value={fmtEuro(maxBuyPower1)}
          sub="AIP 1 + Fundos"
        />
        <MetricCard
          label={`Poder de compra (${fin.aip2Bank || 'Banco 2'})`}
          value={fmtEuro(maxBuyPower2)}
          sub="AIP 2 + Fundos"
        />
        <MetricCard
          label="Imóveis viáveis"
          value={`${viable.length} / ${properties.length}`}
          sub="Com AIPs atuais"
          color={viable.length > 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Savings & HTB */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2
            className="text-lg text-gray-900 mb-4"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Meus Recursos
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormField label="Poupança (€)" hint="Total disponível em conta">
              <Input
                type="number"
                min={0}
                value={fin.savings || ''}
                onChange={(e) => set('savings', Number(e.target.value) || 0)}
                placeholder="0"
              />
            </FormField>
            <FormField label="Help to Buy aprovado (€)" hint="Valor aprovado pelo Revenue">
              <Input
                type="number"
                min={0}
                value={fin.htb || ''}
                onChange={(e) => set('htb', Number(e.target.value) || 0)}
                placeholder="0"
              />
            </FormField>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Resumo dos fundos</p>
            <CalcRow label="Poupança" value={fmtEuro(fin.savings || 0)} />
            <CalcRow label="Help to Buy" value={fmtEuro(fin.htb || 0)} />
            <CalcRow label="Total" value={fmtEuro(totalFunds)} bold accent />
          </div>

          {avgPrice > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                Análise vs. portfólio
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Preço médio dos seus imóveis: <strong>{fmtEuro(avgPrice)}</strong>
              </p>
              <CalcRow label="Depósito necessário (10%)" value={fmtEuro(avgPrice * 0.1)} />
              <CalcRow label="Seus fundos" value={fmtEuro(totalFunds)} />
              <div className="mt-2">
                {totalFunds >= avgPrice * 0.1 ? (
                  <span className="text-xs text-emerald-600 font-medium">
                    ✓ Depósito coberto para o preço médio do portfólio
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">
                    ⚠ Faltam {fmtEuro(avgPrice * 0.1 - totalFunds)} para cobrir o depósito médio
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AIPs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2
            className="text-lg text-gray-900 mb-4"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Aprovações em Princípio (AIP)
          </h2>
          <div className="space-y-4">
            <AIPBlock aipNum={1} fin={fin} setFin={setFin} />
            <AIPBlock aipNum={2} fin={fin} setFin={setFin} />
          </div>

          {/* AIP comparison */}
          {fin.aip1Value > 0 && fin.aip2Value > 0 && (
            <div className="mt-4 bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Comparativo AIP</p>
              <CalcRow
                label={fin.aip1Bank || 'Banco 1'}
                value={fmtEuro(fin.aip1Value)}
                sub={`${fmtEuro(monthly1)}/mês`}
              />
              <CalcRow
                label={fin.aip2Bank || 'Banco 2'}
                value={fmtEuro(fin.aip2Value)}
                sub={`${fmtEuro(monthly2)}/mês`}
              />
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Melhor AIP:{' '}
                  <strong className="text-emerald-600">
                    {fin.aip1Value >= fin.aip2Value
                      ? fin.aip1Bank || 'Banco 1'
                      : fin.aip2Bank || 'Banco 2'}{' '}
                    ({fmtEuro(Math.max(fin.aip1Value, fin.aip2Value))})
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mortgage params */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2
          className="text-lg text-gray-900 mb-4"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Parâmetros da Hipoteca
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <FormField label="Taxa de juros anual (%)" hint="Padrão: 4%">
            <Input
              type="number"
              step="0.1"
              min={0}
              max={20}
              value={fin.interestRate}
              onChange={(e) => set('interestRate', Number(e.target.value) || 4)}
            />
          </FormField>
          <FormField label="Prazo (anos)" hint="Padrão: 30 anos">
            <Input
              type="number"
              min={5}
              max={35}
              value={fin.termYears}
              onChange={(e) => set('termYears', Number(e.target.value) || 30)}
            />
          </FormField>
          <div className="col-span-2 bg-gray-50 rounded-xl p-4 flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total de meses</p>
              <p className="font-semibold text-gray-700">{(fin.termYears || 30) * 12}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Taxa mensal</p>
              <p className="font-semibold text-gray-700">
                {((fin.interestRate || 4) / 100 / 12).toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stress test config */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2
          className="text-lg text-gray-900 mb-1"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Stress Test Bancário
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Os bancos testam se você consegue pagar a hipoteca a uma taxa mais alta. Configure sua renda para ver o resultado.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <FormField label="Renda líquida mensal (€)" hint="Salário líquido combinado do casal">
            <Input
              type="number"
              min={0}
              value={fin.netMonthlyIncome || ''}
              onChange={(e) => set('netMonthlyIncome', Number(e.target.value) || 0)}
              placeholder="5000"
            />
          </FormField>
          <div className="bg-gray-50 rounded-xl p-4 col-span-2">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">Taxa stress</p>
                <p className="font-semibold text-gray-700">{(fin.interestRate || 4) + 2}%</p>
                <p className="text-xs text-gray-400">({fin.interestRate || 4}% + 2%)</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Máx. prestação (35%)</p>
                <p className="font-semibold text-emerald-600">
                  {fin.netMonthlyIncome ? fmtEuro((fin.netMonthlyIncome || 0) * 0.35) : '—'}/mês
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Regra</p>
                <p className="text-xs text-gray-500">Prestação stress ≤ 35% da renda líquida mensal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property-by-property table */}
      {properties.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2
              className="text-lg text-gray-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Simulação por Imóvel
            </h2>
            <p className="text-sm text-gray-400">
              Com base nos parâmetros atuais · FHS calculado pelas regras reais irlandesas
              {fin.netMonthlyIncome ? ` · Stress test a ${(fin.interestRate || 4) + 2}%` : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Imóvel</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Preço</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Depósito</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {fin.aip1Bank || 'Banco 1'} — Viab.
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    FHS ({fin.aip1Bank || 'B1'})
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Prestação ({fin.aip1Bank || 'B1'})
                  </th>
                  {fin.netMonthlyIncome ? (
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Stress ({fin.aip1Bank || 'B1'})
                    </th>
                  ) : null}
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {fin.aip2Bank || 'Banco 2'} — Viab.
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Prestação ({fin.aip2Bank || 'B2'})
                  </th>
                  {fin.netMonthlyIncome ? (
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Stress ({fin.aip2Bank || 'B2'})
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => {
                  const sim = simulateProperty(p, fin);
                  const stressColors = {
                    aprovado:  'text-emerald-600',
                    risco:     'text-amber-600',
                    reprovado: 'text-red-600',
                  };
                  const stressLabels = {
                    aprovado:  '✓ Aprovado',
                    risco:     '⚠ Risco',
                    reprovado: '✕ Reprovado',
                  };
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{p.name}</span>
                        {p.favorite && <span className="ml-1 text-amber-400 text-xs">★</span>}
                        <div className="text-xs text-gray-400">{p.city}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {fmtEuro(Number(p.price || 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {fmtEuro(sim.deposit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ViabilityBadge status={sim.aip1.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {sim.aip1.fhsDetail.fhsRequired > 0 ? (
                          <span>
                            {fmtEuro(sim.aip1.fhsDetail.fhsRequired)}
                            <span className={`ml-1 text-xs ${sim.aip1.fhsDetail.eligible ? 'text-emerald-500' : 'text-red-500'}`}>
                              ({(sim.aip1.fhsDetail.fhsPct * 100).toFixed(0)}%)
                            </span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {fmtEuro(sim.aip1.monthlyPayment)}/mês
                      </td>
                      {fin.netMonthlyIncome ? (
                        <td className="px-4 py-3 text-center">
                          {sim.aip1.stressTest ? (
                            <span className={`text-xs font-semibold ${stressColors[sim.aip1.stressTest.result]}`}>
                              {stressLabels[sim.aip1.stressTest.result]}
                            </span>
                          ) : '—'}
                        </td>
                      ) : null}
                      <td className="px-4 py-3 text-center">
                        <ViabilityBadge status={sim.aip2.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {fmtEuro(sim.aip2.monthlyPayment)}/mês
                      </td>
                      {fin.netMonthlyIncome ? (
                        <td className="px-4 py-3 text-center">
                          {sim.aip2.stressTest ? (
                            <span className={`text-xs font-semibold ${stressColors[sim.aip2.stressTest.result]}`}>
                              {stressLabels[sim.aip2.stressTest.result]}
                            </span>
                          ) : '—'}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CalcRow helper ──────────────────────────────────────────────────────────

function CalcRow({
  label,
  value,
  sub,
  bold,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between py-1.5',
        bold && 'border-t border-gray-200 mt-1 pt-2.5'
      )}
    >
      <span className={clsx('text-sm', bold ? 'font-semibold text-gray-800' : 'text-gray-500')}>
        {label}
      </span>
      <div className="text-right">
        <span
          className={clsx(
            'text-sm font-semibold',
            accent ? 'text-emerald-600' : 'text-gray-800'
          )}
        >
          {value}
        </span>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}

// ─── AIPBlock ────────────────────────────────────────────────────────────────
// Full AIP editor: base fields + expandable "Oferta do Banco" section

function AIPBlock({
  aipNum,
  fin,
  setFin,
}: {
  aipNum: 1 | 2;
  fin: FinancialConfig;
  setFin: (f: FinancialConfig) => void;
}) {
  const [showOffer, setShowOffer] = React.useState(false);

  const bankKey   = aipNum === 1 ? 'aip1Bank'   : 'aip2Bank';
  const valueKey  = aipNum === 1 ? 'aip1Value'  : 'aip2Value';
  const detailKey = aipNum === 1 ? 'aip1Detail' : 'aip2Detail';

  const bankName  = fin[bankKey] as string;
  const aipValue  = fin[valueKey] as number;
  const detail    = (fin[detailKey] ?? {}) as Partial<AIPDetail>;

  const setBase = (k: typeof bankKey | typeof valueKey, v: string | number) =>
    setFin({ ...fin, [k]: v });

  const setDetail = (patch: Partial<AIPDetail>) =>
    setFin({ ...fin, [detailKey]: { ...detail, bank: bankName, mortgageAmount: aipValue, ...patch } });

  const clearDetail = () =>
    setFin({ ...fin, [detailKey]: undefined });

  // Computed monthly using bank's own figures (for display in the offer card)
  const bankMonthly = detail.offerMonthlyRepayment
    ? detail.offerMonthlyRepayment
    : (detail.offerRate && detail.offerTermYears && aipValue)
      ? calcMonthlyPayment(aipValue, detail.offerRate, detail.offerTermYears)
      : null;

  const globalMonthly = calcMonthlyPayment(aipValue, fin.interestRate || 4, fin.termYears || 30);

  const hasOfferData = !!(detail.offerRate || detail.offerTermYears || detail.offerPurchasePrice || detail.offerMonthlyRepayment);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* ── Base AIP fields ── */}
      <div className="p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          AIP {aipNum}
          {hasOfferData && (
            <span className="ml-2 text-blue-600 normal-case font-normal">· Oferta registada</span>
          )}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nome do banco">
            <Input
              value={bankName}
              onChange={(e) => setBase(bankKey, e.target.value)}
              placeholder={aipNum === 1 ? 'Ex: AIB' : 'Ex: Bank of Ireland'}
            />
          </FormField>
          <FormField label="Valor aprovado AIP (€)">
            <Input
              type="number"
              min={0}
              value={aipValue || ''}
              onChange={(e) => setBase(valueKey, Number(e.target.value) || 0)}
              placeholder="300000"
            />
          </FormField>
        </div>

        {/* Offer summary card — shown when data is present */}
        {hasOfferData && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
            {detail.offerPurchasePrice ? (
              <div>
                <p className="text-blue-400 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Preço usado</p>
                <p className="font-bold text-blue-800">{fmtEuro(detail.offerPurchasePrice)}</p>
              </div>
            ) : null}
            {detail.offerRate ? (
              <div>
                <p className="text-blue-400 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Taxa do banco</p>
                <p className="font-bold text-blue-800">
                  {detail.offerRate}%
                  {detail.offerRateType === 'fixed' && detail.offerRateFixedMonths
                    ? ` Fixed ${detail.offerRateFixedMonths}m`
                    : detail.offerRateType === 'variable' ? ' Variable' : ''}
                </p>
              </div>
            ) : null}
            {detail.offerTermYears ? (
              <div>
                <p className="text-blue-400 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Prazo</p>
                <p className="font-bold text-blue-800">{detail.offerTermYears} anos</p>
              </div>
            ) : null}
            {bankMonthly ? (
              <div>
                <p className="text-blue-400 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Prestação</p>
                <p className="font-bold text-blue-800">{fmtEuro2(bankMonthly)}/mês</p>
                {detail.offerMonthlyRepayment && (
                  <p className="text-blue-400 text-[10px]">citado pelo banco</p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Comparison: bank offer vs our calculation */}
        {hasOfferData && bankMonthly && (
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>
              Cálculo próprio ({fin.interestRate}% / {fin.termYears}a):{' '}
              <strong className="text-gray-700">{fmtEuro(globalMonthly)}/mês</strong>
            </span>
            <span className="text-gray-300">·</span>
            <span>
              Banco ({detail.offerRate ?? fin.interestRate}% / {detail.offerTermYears ?? fin.termYears}a):{' '}
              <strong className="text-emerald-600">{fmtEuro2(bankMonthly)}/mês</strong>
              {detail.offerMonthlyRepayment ? ' ✓' : ''}
            </span>
          </div>
        )}

        {!hasOfferData && aipValue > 0 && (
          <p className="text-xs text-emerald-600 mt-2">
            Prestação estimada (taxa global {fin.interestRate}%): <strong>{fmtEuro(globalMonthly)}/mês</strong>
          </p>
        )}
      </div>

      {/* ── Toggle offer section ── */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-500 border-t border-gray-100"
        onClick={() => setShowOffer((v) => !v)}
      >
        <span>🏦 Detalhes da Oferta do Banco {hasOfferData ? '(preenchido)' : '(opcional)'}</span>
        {showOffer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* ── Offer detail fields ── */}
      {showOffer && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400 mb-4">
            Preencha com os dados da carta de oferta do banco. Estes valores substituem a taxa/prazo globais nos cálculos.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormField label="Valor da hipoteca (€)" hint="Mortgage amount da carta">
              <Input
                type="number"
                min={0}
                value={detail.offerPurchasePrice !== undefined ? detail.offerPurchasePrice : ''}
                placeholder="Ex: 398000"
                onChange={(e) => setDetail({ offerPurchasePrice: Number(e.target.value) || undefined })}
              />
            </FormField>

            <FormField label="Taxa de juro (%)" hint="Ex: 3.450">
              <Input
                type="number"
                step="0.001"
                min={0}
                max={20}
                value={detail.offerRate !== undefined ? detail.offerRate : ''}
                placeholder="Ex: 3.45"
                onChange={(e) => setDetail({ offerRate: Number(e.target.value) || undefined })}
              />
            </FormField>

            <FormField label="Tipo de taxa">
              <Select
                value={detail.offerRateType ?? ''}
                onChange={(e) => setDetail({ offerRateType: e.target.value as 'fixed' | 'variable' | '' || undefined })}
              >
                <option value="">Selecionar...</option>
                <option value="fixed">Fixed (fixa)</option>
                <option value="variable">Variable (variável)</option>
              </Select>
            </FormField>

            {detail.offerRateType === 'fixed' && (
              <FormField label="Período fixo (meses)" hint="Ex: 48 para 4 anos">
                <Input
                  type="number"
                  min={1}
                  value={detail.offerRateFixedMonths !== undefined ? detail.offerRateFixedMonths : ''}
                  placeholder="Ex: 48"
                  onChange={(e) => setDetail({ offerRateFixedMonths: Number(e.target.value) || undefined })}
                />
              </FormField>
            )}

            <FormField label="Prazo (anos)" hint="Mortgage term da carta">
              <Input
                type="number"
                min={1}
                max={35}
                value={detail.offerTermYears !== undefined ? detail.offerTermYears : ''}
                placeholder="Ex: 34"
                onChange={(e) => setDetail({ offerTermYears: Number(e.target.value) || undefined })}
              />
            </FormField>

            <FormField label="Prestação mensal (€)" hint="Monthly repayment da carta">
              <Input
                type="number"
                step="0.01"
                min={0}
                value={detail.offerMonthlyRepayment !== undefined ? detail.offerMonthlyRepayment : ''}
                placeholder="Ex: 1491.58"
                onChange={(e) => setDetail({ offerMonthlyRepayment: Number(e.target.value) || undefined })}
              />
            </FormField>

            <div className="sm:col-span-3">
              <FormField label="Notas adicionais">
                <Input
                  value={detail.offerNotes ?? ''}
                  placeholder="Ex: Válido por 12 meses, requer seguro de vida..."
                  onChange={(e) => setDetail({ offerNotes: e.target.value || undefined })}
                />
              </FormField>
            </div>
          </div>

          {hasOfferData && (
            <div className="mt-3 flex justify-end">
              <button
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
                onClick={clearDetail}
              >
                Limpar dados da oferta
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
