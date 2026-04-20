// src/lib/calculations.ts
// All financial logic. Pure functions — no side effects.

import type {
  Property,
  FinancialConfig,
  PropertySimulation,
  AIPSimulation,
  AIPDetail,
  FHSDetail,
  StressTest,
  StressResult,
  ViabilityStatus,
} from '@/types';

// ─── Mortgage formula ────────────────────────────────────────────────────────

/**
 * Standard annuity (amortisation) monthly payment.
 * M = P · [ r(1+r)^n ] / [ (1+r)^n – 1 ]
 */
export function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

// ─── Real FHS rules (Ireland) ────────────────────────────────────────────────

function calcFHSDetail(
  price: number,
  aip: number,
  savings: number,
  htb: number
): FHSDetail {
  const shortfall = Math.max(0, price - (aip + savings + htb));
  const fhsPct = price > 0 ? shortfall / price : 0;
  const maxAllowedPct = htb > 0 ? 0.20 : 0.30;
  const eligible =
    aip > 0 &&
    fhsPct <= maxAllowedPct &&
    savings + htb >= price * 0.10;
  return { fhsRequired: shortfall, fhsPct, maxAllowedPct, eligible };
}

// ─── Viability ───────────────────────────────────────────────────────────────

function determineStatus(
  price: number,
  aip: number,
  savings: number,
  htb: number
): ViabilityStatus {
  if (aip <= 0) return 'red';
  const totalBuyer = aip + savings + htb;
  if (totalBuyer >= price) return 'green';
  const fhs = calcFHSDetail(price, aip, savings, htb);
  if (fhs.eligible) return 'yellow';
  return 'red';
}

// ─── Stress test ─────────────────────────────────────────────────────────────

function calcStressTest(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  netMonthlyIncome: number
): StressTest {
  const stressRate = annualRate + 2;
  const stressedMonthlyPayment = calcMonthlyPayment(loanAmount, stressRate, termYears);
  const maxAffordablePayment = netMonthlyIncome * 0.35;
  let result: StressResult;
  if (stressedMonthlyPayment <= maxAffordablePayment) result = 'aprovado';
  else if (stressedMonthlyPayment <= maxAffordablePayment * 1.15) result = 'risco';
  else result = 'reprovado';
  return { stressRate, stressedMonthlyPayment, maxAffordablePayment, result };
}

// ─── AIP simulation ──────────────────────────────────────────────────────────
//
// Rate/term priority:
//   1. Bank's own offer rate/term (from the AIP letter)  ← most accurate
//   2. Global fallback rate/term configured in dashboard ← estimate

function simulateAIP(
  price: number,
  aipValue: number,
  bankName: string,
  savings: number,
  htb: number,
  globalRate: number,
  globalTerm: number,
  netMonthlyIncome: number,
  detail?: AIPDetail
): AIPSimulation {
  const fhsDetail = calcFHSDetail(price, aipValue, savings, htb);
  const status = determineStatus(price, aipValue, savings, htb);

  const totalLoanAmount =
    status !== 'red' && fhsDetail.fhsRequired > 0
      ? aipValue + fhsDetail.fhsRequired
      : aipValue;

  // Use bank's own offer rate/term if provided, else fall back to global
  const effectiveRate = detail?.offerRate ?? globalRate;
  const effectiveTerm = detail?.offerTermYears ?? globalTerm;
  const usedBankOffer = !!(detail?.offerRate || detail?.offerTermYears);

  // If the bank quoted a monthly repayment, surface it for comparison
  // but always also calculate our own value for the simulation
  const monthlyPayment = calcMonthlyPayment(totalLoanAmount, effectiveRate, effectiveTerm);

  const stressTest =
    netMonthlyIncome > 0
      ? calcStressTest(totalLoanAmount, effectiveRate, effectiveTerm, netMonthlyIncome)
      : undefined;

  return {
    bankName,
    aipValue,
    fhsRequired: status !== 'red' ? fhsDetail.fhsRequired : 0,
    fhsDetail,
    status,
    monthlyPayment,
    totalLoanAmount,
    effectiveRate,
    effectiveTerm,
    usedBankOffer,
    stressTest,
  };
}

// ─── Full property simulation ────────────────────────────────────────────────

export function simulateProperty(
  property: Property,
  fin: FinancialConfig
): PropertySimulation {
  const price = Number(property.price) || 0;
  const savings = fin.savings || 0;
  const htb = fin.htb || 0;
  const income = fin.netMonthlyIncome || 0;

  return {
    propertyId: property.id,
    propertyPrice: price,
    deposit: price * 0.1,
    availableFunds: savings + htb,
    depositGap: price * 0.1 - (savings + htb),
    aip1: simulateAIP(
      price, fin.aip1Value || 0, fin.aip1Bank || 'Banco 1',
      savings, htb, fin.interestRate || 4, fin.termYears || 30, income,
      fin.aip1Detail
    ),
    aip2: simulateAIP(
      price, fin.aip2Value || 0, fin.aip2Bank || 'Banco 2',
      savings, htb, fin.interestRate || 4, fin.termYears || 30, income,
      fin.aip2Detail
    ),
  };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function fmtEuro(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function fmtEuro2(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function fmtPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function fmtNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}

export function bestStatus(sim: PropertySimulation): ViabilityStatus {
  const statuses: ViabilityStatus[] = [sim.aip1.status, sim.aip2.status];
  if (statuses.includes('green')) return 'green';
  if (statuses.includes('yellow')) return 'yellow';
  return 'red';
}

// ─── Affordable Housing Scheme eligibility ───────────────────────────────────

import type { AffordableEligibility, AffordableEligibilityStatus } from '@/types';

/**
 * Calculate whether the buyer can afford an Affordable Housing Scheme property.
 *
 * Key rules:
 * - The council sells at a DISCOUNTED price (minSalePrice to maxSalePrice)
 * - The council retains an equity % in the property (equityDiscountPct)
 * - Buyer must finance the sale price (not the full market value)
 * - Buyer needs: AIP + savings + HTB >= minSalePrice (best case)
 * - Income limit: ≤ €96k single / ≤ €128k joint
 *
 * We simulate against the MIN sale price (most favourable to the buyer).
 */
export function calcAffordableEligibility(
  property: import('@/types').Property,
  fin: FinancialConfig
): AffordableEligibility {
  const data = property.affordableData ?? {};
  const {
    openMarketValue = 0,
    minSalePrice = 0,
    maxSalePrice = 0,
    equityDiscountPct = 0,
  } = data;

  // Need at least minSalePrice to calculate
  if (!minSalePrice) {
    return {
      status: 'incomplete',
      purchasePrice: 0,
      totalBuyerFunds: 0,
      shortfall: 0,
      equityAmount: 0,
      effectivePurchasePrice: 0,
      monthlyPayment1: 0,
      monthlyPayment2: 0,
    };
  }

  const savings = fin.savings || 0;
  const htb    = fin.htb || 0;
  const aip1   = fin.aip1Value || 0;
  const aip2   = fin.aip2Value || 0;

  // Equity the council holds (€)
  const equityAmount = openMarketValue
    ? openMarketValue * (equityDiscountPct / 100)
    : 0;

  // Effective purchase price = what buyer actually pays (min sale price is most optimistic)
  const effectivePurchasePrice = minSalePrice;

  // Can buyer cover the purchase price?
  const bestAIP = Math.max(aip1, aip2);
  const totalBuyerFunds = bestAIP + savings + htb;
  const shortfall = Math.max(0, effectivePurchasePrice - totalBuyerFunds);

  // Monthly payments using each AIP (rate/term from global or bank offer)
  const rate1  = fin.aip1Detail?.offerRate  ?? fin.interestRate ?? 4;
  const term1  = fin.aip1Detail?.offerTermYears ?? fin.termYears ?? 30;
  const rate2  = fin.aip2Detail?.offerRate  ?? fin.interestRate ?? 4;
  const term2  = fin.aip2Detail?.offerTermYears ?? fin.termYears ?? 30;

  // Loan = min sale price - (savings + htb) [buyer funds cover deposit portion]
  const loan1 = Math.max(0, minSalePrice - (savings + htb));
  const loan2 = Math.max(0, minSalePrice - (savings + htb));

  const monthlyPayment1 = aip1 > 0 ? calcMonthlyPayment(Math.min(loan1, aip1), rate1, term1) : 0;
  const monthlyPayment2 = aip2 > 0 ? calcMonthlyPayment(Math.min(loan2, aip2), rate2, term2) : 0;

  // Eligibility status
  let status: AffordableEligibilityStatus;
  if (!aip1 && !aip2) {
    status = 'incomplete';
  } else if (shortfall === 0) {
    status = 'eligible';
  } else if (maxSalePrice && totalBuyerFunds >= maxSalePrice) {
    // Can't afford min but might negotiate within range — borderline
    status = 'borderline';
  } else if (totalBuyerFunds >= minSalePrice * 0.85) {
    // Within 15% of min price — borderline
    status = 'borderline';
  } else {
    status = 'ineligible';
  }

  return {
    status,
    purchasePrice: effectivePurchasePrice,
    totalBuyerFunds,
    shortfall,
    equityAmount,
    effectivePurchasePrice,
    monthlyPayment1,
    monthlyPayment2,
  };
}
