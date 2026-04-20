// src/types/index.ts

// ─── House types ─────────────────────────────────────────────────────────────

export type HouseType =
  | 'semi-detached'
  | 'detached'
  | 'end-of-terrace'
  | 'mid-terrace'
  | '';

export const HOUSE_TYPE_LABELS: Record<Exclude<HouseType, ''>, string> = {
  'semi-detached':  'Semi-detached',
  'detached':       'Detached',
  'end-of-terrace': 'End of terrace',
  'mid-terrace':    'Mid terrace',
};

// ─── Development ─────────────────────────────────────────────────────────────

export interface Development {
  id: string;
  name: string;
  city: string;       // cidade (ex: Naas)
  county?: string;    // condado (ex: Kildare)
  website: string;
  brochureUrl?: string;
  imageUrl?: string;  // logo/photo
  siteMapImage?: string; // planta do empreendimento (base64 or URL)

  // Transport — shared by all properties in this development
  eircode?: string;
  trainStation?: string;
  trainMinutesToDublin?: number | '';

  createdAt: string;
}

// ─── Affordable Scheme Data (from the council's property table) ───────────────
//
// These are the figures published by the Local Authority for each property type.
// Example from the table in the screenshot:
//   openMarketValue: 390000
//   minSalePrice:    312000   (price you pay with max equity discount)
//   maxSalePrice:    370500   (price you pay with min equity discount)
//   equityDiscountPct: 20     (% the council keeps as equity, e.g. 20%)
//   berRating:       'A2'
//   unitsAvailable:  4

export interface AffordableSchemeData {
  openMarketValue?: number;    // Open Market Value (OMV) — real market price
  minSalePrice?: number;       // Minimum sale price (max discount applied)
  maxSalePrice?: number;       // Maximum sale price (min discount applied)
  equityDiscountPct?: number;  // Optimum equity discount % (e.g. 20 for 20%)
  berRating?: string;          // BER rating (A2, B1, etc.)
  unitsAvailable?: number;     // No of homes available of this type
}

// ─── Property ────────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  name: string;
  city: string;       // kept for backward compat
  county?: string;    // used when standalone (no development)
  website: string;    // kept for backward compat
  area: number | '';
  rooms: number | '';
  price: number | '';
  visitDate: string;
  visited: boolean;
  pros: string;
  cons: string;
  rating: number;
  favorite: boolean;
  createdAt: string;

  houseType?: HouseType;
  developmentId?: string;
  brochureUrl?: string;
  imageUrl?: string;
  plotNumber?: string;  // house number on the development site map (ex: "12", "B4")

  // transport — used for standalone properties (inherited from dev when linked)
  eircode?: string;
  trainStation?: string;
  trainMinutesToDublin?: number | '';

  isAffordableScheme?: boolean;
  affordableData?: AffordableSchemeData;
}

// ─── Affordable Housing Scheme applications ───────────────────────────────────

export interface AffordableUpdate {
  id: string;
  date: string;
  hasResponse: boolean;
  comment: string;
  createdAt: string;
}

export interface AffordableApplication {
  id: string;
  propertyId: string;
  applicationDate: string;
  updates: AffordableUpdate[];
  createdAt: string;
}

// ─── Affordable eligibility result ───────────────────────────────────────────

export type AffordableEligibilityStatus =
  | 'eligible'       // can afford the min sale price with AIP + savings
  | 'borderline'     // can afford somewhere in the min–max range
  | 'ineligible'     // cannot afford even the min sale price
  | 'incomplete';    // missing data to calculate

export interface AffordableEligibility {
  status: AffordableEligibilityStatus;
  purchasePrice: number;         // the price we simulate (min sale price)
  totalBuyerFunds: number;       // AIP + savings + HTB
  shortfall: number;             // max(0, purchasePrice - totalBuyerFunds)
  equityAmount: number;          // openMarketValue * equityDiscountPct/100
  effectivePurchasePrice: number;// openMarketValue - equityAmount
  monthlyPayment1: number;       // using AIP1
  monthlyPayment2: number;       // using AIP2
  // Income check (if configured)
  maxIncome?: number;            // 96k single / 128k joint
  incomeEligible?: boolean;
}

// ─── AIP Detail ──────────────────────────────────────────────────────────────

export interface AIPDetail {
  bank: string;
  mortgageAmount: number;
  offerPurchasePrice?: number;
  offerRate?: number;
  offerRateType?: 'fixed' | 'variable';
  offerRateFixedMonths?: number;
  offerTermYears?: number;
  offerMonthlyRepayment?: number;
  offerNotes?: string;
}

// ─── Financial config ────────────────────────────────────────────────────────

export interface FinancialConfig {
  savings: number;
  htb: number;
  aip1Bank: string;
  aip1Value: number;
  aip2Bank: string;
  aip2Value: number;
  interestRate: number;
  termYears: number;
  netMonthlyIncome?: number;
  aip1Detail?: AIPDetail;
  aip2Detail?: AIPDetail;
}

// ─── Simulation types ────────────────────────────────────────────────────────

export type ViabilityStatus = 'green' | 'yellow' | 'red';
export type StressResult   = 'aprovado' | 'risco' | 'reprovado';

export interface FHSDetail {
  fhsRequired: number;
  fhsPct: number;
  maxAllowedPct: number;
  eligible: boolean;
}

export interface StressTest {
  stressRate: number;
  stressedMonthlyPayment: number;
  maxAffordablePayment: number;
  result: StressResult;
}

export interface AIPSimulation {
  bankName: string;
  aipValue: number;
  fhsRequired: number;
  fhsDetail: FHSDetail;
  status: ViabilityStatus;
  monthlyPayment: number;
  totalLoanAmount: number;
  effectiveRate: number;
  effectiveTerm: number;
  usedBankOffer: boolean;
  stressTest?: StressTest;
}

export interface PropertySimulation {
  propertyId: string;
  propertyPrice: number;
  deposit: number;
  availableFunds: number;
  depositGap: number;
  aip1: AIPSimulation;
  aip2: AIPSimulation;
}
