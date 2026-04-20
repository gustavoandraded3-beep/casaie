// src/app/calculator/page.tsx
'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { calcMonthlyPayment, simulateProperty, fmtEuro } from '@/lib/calculations';import {
  SectionHeader,
  MetricCard,
  Input,
  FormField,
  ViabilityBadge,
} from '@/components/ui';

export default function CalculatorPage() {
  const { fin, properties } = useStore();

  // Free-form calculator state
  const [principal, setPrincipal] = useState(300000);
  const [rate, setRate] = useState(fin.interestRate || 4);
  const [term, setTerm] = useState(fin.termYears || 30);

  const monthly = calcMonthlyPayment(principal, rate, term);
  const totalRepaid = monthly * term * 12;
  const totalInterest = totalRepaid - principal;

  const monthly1 = calcMonthlyPayment(fin.aip1Value || 0, fin.interestRate || 4, fin.termYears || 30);
  const monthly2 = calcMonthlyPayment(fin.aip2Value || 0, fin.interestRate || 4, fin.termYears || 30);

  return (
    <div>
      <SectionHeader
        title="Calculadora de Hipoteca"
        subtitle="Simule prestações mensais com a fórmula padrão de amortização"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Free-form calculator */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2
            className="text-lg text-gray-900 mb-4"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Simulação Livre
          </h2>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <FormField label="Capital (Valor do empréstimo) — €">
              <Input
                type="number"
                min={0}
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Taxa de juros anual (%)" hint="Ex: 4 para 4%">
                <Input
                  type="number"
                  step="0.05"
                  min={0}
                  max={20}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value) || 0)}
                />
              </FormField>
              <FormField label="Prazo (anos)" hint="Máx: 35 anos">
                <Input
                  type="number"
                  min={1}
                  max={35}
                  value={term}
                  onChange={(e) => setTerm(Number(e.target.value) || 1)}
                />
              </FormField>
            </div>
          </div>

          {/* Result */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center mb-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">
              Prestação mensal estimada
            </p>
            <p className="text-4xl font-bold text-emerald-700">{fmtEuro(monthly)}</p>
            <p className="text-sm text-emerald-600 mt-1">por mês</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              label="Total reembolsado"
              value={fmtEuro(totalRepaid)}
            />
            <MetricCard
              label="Juros totais"
              value={fmtEuro(totalInterest)}
              color="amber"
            />
            <MetricCard
              label="Nº de prestações"
              value={term * 12}
            />
          </div>

          {/* Formula explanation */}
          <div className="mt-4 bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Fórmula utilizada
            </p>
            <code className="text-xs text-gray-600 block leading-relaxed">
              M = P × [ r(1+r)ⁿ ] / [ (1+r)ⁿ – 1 ]
            </code>
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <p><strong>P</strong> = Capital ({fmtEuro(principal)})</p>
              <p><strong>r</strong> = taxa mensal = {rate}% ÷ 12 = {((rate / 100) / 12).toFixed(5)}</p>
              <p><strong>n</strong> = meses totais = {term} × 12 = {term * 12}</p>
            </div>
          </div>
        </div>

        {/* AIPs comparison */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2
            className="text-lg text-gray-900 mb-1"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Comparativo dos seus AIPs
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Taxa: {fin.interestRate}% · Taxa stress: {(fin.interestRate || 4) + 2}% · Prazo: {fin.termYears} anos
          </p>

          {(!fin.aip1Value && !fin.aip2Value) ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">🏦</p>
              <p className="text-sm">Configure seus AIPs no Dashboard Financeiro</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { bank: fin.aip1Bank || 'Banco 1', aip: fin.aip1Value || 0, monthly: monthly1 },
                { bank: fin.aip2Bank || 'Banco 2', aip: fin.aip2Value || 0, monthly: monthly2 },
              ]
                .filter((a) => a.aip > 0)
                .map(({ bank, aip, monthly: m }) => {
                  const stressRate = (fin.interestRate || 4) + 2;
                  const stressedPayment = calcMonthlyPayment(aip, stressRate, fin.termYears || 30);
                  const maxPayment = (fin.netMonthlyIncome || 0) * 0.35;
                  const totalPaid = m * (fin.termYears || 30) * 12;
                  const interest = totalPaid - aip;

                  let stressResult: 'aprovado' | 'risco' | 'reprovado' | null = null;
                  if (fin.netMonthlyIncome) {
                    if (stressedPayment <= maxPayment) stressResult = 'aprovado';
                    else if (stressedPayment <= maxPayment * 1.15) stressResult = 'risco';
                    else stressResult = 'reprovado';
                  }

                  const stressBg = stressResult === 'aprovado' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : stressResult === 'risco' ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : stressResult === 'reprovado' ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500';

                  return (
                    <div
                      key={bank}
                      className="border border-gray-100 rounded-xl p-4 hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-gray-800">{bank}</p>
                        <span className="text-xs text-gray-400 font-medium">
                          AIP: {fmtEuro(aip)}
                        </span>
                      </div>

                      {/* Side-by-side: normal vs stressed */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-emerald-600 mb-1">Prestação normal ({fin.interestRate}%)</p>
                          <p className="text-2xl font-bold text-emerald-700">{fmtEuro(m)}</p>
                          <p className="text-xs text-emerald-500">/mês</p>
                        </div>
                        <div className={`rounded-xl p-3 text-center border ${stressBg}`}>
                          <p className="text-xs mb-1 opacity-80">Prestação stress ({stressRate}%)</p>
                          <p className="text-2xl font-bold">{fmtEuro(stressedPayment)}</p>
                          <p className="text-xs opacity-70">/mês</p>
                        </div>
                      </div>

                      {/* Stress result badge */}
                      {stressResult && (
                        <div className={`rounded-lg border px-3 py-2 text-xs font-semibold flex items-center justify-between mb-3 ${stressBg}`}>
                          <span>
                            {stressResult === 'aprovado' ? '✓ Stress test: Aprovado'
                              : stressResult === 'risco' ? '⚠ Stress test: Risco Moderado'
                              : '✕ Stress test: Reprovado'}
                          </span>
                          <span className="font-normal opacity-70">
                            Máx. {fmtEuro(maxPayment)}/mês (35% de {fmtEuro(fin.netMonthlyIncome || 0)})
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-gray-400">Total reembolsado</p>
                          <p className="font-semibold text-gray-700">{fmtEuro(totalPaid)}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2">
                          <p className="text-amber-500">Juros totais</p>
                          <p className="font-semibold text-amber-700">{fmtEuro(interest)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Winner callout */}
              {fin.aip1Value > 0 && fin.aip2Value > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-emerald-700">
                  <strong>Melhor condição:</strong>{' '}
                  {fin.aip1Value >= fin.aip2Value
                    ? fin.aip1Bank || 'Banco 1'
                    : fin.aip2Bank || 'Banco 2'}{' '}
                  oferece o maior valor de AIP.{' '}
                  {monthly1 <= monthly2
                    ? `${fin.aip1Bank || 'Banco 1'} tem a menor prestação.`
                    : `${fin.aip2Bank || 'Banco 2'} tem a menor prestação.`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Per-property table */}
      {properties.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2
              className="text-lg text-gray-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Prestações por Imóvel
            </h2>
            <p className="text-sm text-gray-400">
              Capital = AIP + FHS (quando necessário) · {fin.aip1Bank || 'Banco 1'} · {fin.interestRate}% / {fin.termYears} anos
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Imóvel</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Preço</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">FHS est.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Capital total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prestação/mês</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total pago</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Viabilidade</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => {
                  const sim = simulateProperty(p, fin);
                  const s = sim.aip1;
                  const totalPaid = s.monthlyPayment * (fin.termYears || 30) * 12;
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.city}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {fmtEuro(Number(p.price || 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600">
                        {s.fhsRequired > 0 ? fmtEuro(s.fhsRequired) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {fmtEuro(s.totalLoanAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {fmtEuro(s.monthlyPayment)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {fmtEuro(totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ViabilityBadge status={s.status} />
                      </td>
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
