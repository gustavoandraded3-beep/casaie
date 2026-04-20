# 🏠 CasaIE v2 — Rastreador de Imóveis na Irlanda

Aplicação web para rastrear, comparar e avaliar imóveis na Irlanda.  
Inclui simulador completo de hipoteca, Help to Buy (HTB), First Home Scheme (FHS com regras reais irlandesas) e stress test bancário.

---

## 🚀 Como rodar localmente

```bash
unzip casaie.zip
cd casaie
npm install
npm run dev
# Abra http://localhost:3000
```

Necessário: **Node.js 18+**. Sem banco de dados, sem conta — tudo salvo no `localStorage` do navegador.

---

## ☁️ Deploy no Vercel (recomendado)

### Opção A — Via CLI (mais rápido)

```bash
npm install -g vercel
vercel login
vercel          # segue o assistente interativo
```

### Opção B — Via GitHub

1. Crie um repositório no GitHub e faça push do código:
   ```bash
   git init
   git add .
   git commit -m "CasaIE v2"
   git remote add origin https://github.com/SEU_USUARIO/casaie.git
   git push -u origin main
   ```
2. Acesse [vercel.com/new](https://vercel.com/new)
3. Importe o repositório → clique **Deploy**
4. Pronto! O Vercel detecta Next.js automaticamente.

### Variáveis de ambiente no Vercel

Se quiser usar upload de ficheiros via Supabase (opcional):
1. No painel Vercel → **Settings → Environment Variables**
2. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = URL do seu projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave anon do Supabase
3. Redeploy

Sem as variáveis, a app funciona normalmente — apenas os campos de URL de imagem/brochura ficam como texto simples.

---

## 📁 Estrutura do projecto

```
casaie/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout raiz (Navbar + StoreProvider)
│   │   ├── globals.css
│   │   ├── page.tsx                # Imóveis — lista/cards + CRUD
│   │   ├── developments/
│   │   │   └── page.tsx            # Empreendimentos — CRUD
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Dashboard financeiro + stress test
│   │   ├── compare/
│   │   │   └── page.tsx            # Comparar imóveis
│   │   └── calculator/
│   │       └── page.tsx            # Calculadora de hipoteca
│   │
│   ├── components/
│   │   ├── ui/index.tsx            # Componentes reutilizáveis
│   │   ├── layout/Navbar.tsx       # Navegação
│   │   └── properties/
│   │       ├── PropertyCard.tsx
│   │       ├── PropertyForm.tsx
│   │       └── PropertyDetail.tsx
│   │
│   ├── lib/
│   │   ├── calculations.ts         # Toda a lógica financeira (funções puras)
│   │   └── store.tsx               # Estado global + localStorage + migração
│   │
│   ├── hooks/useLocalStorage.ts
│   └── types/index.ts              # TypeScript types (v2 com novos campos)
│
├── .env.local.example              # Template de variáveis de ambiente
├── vercel.json                     # Config de deploy
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔄 Migração de dados (v1 → v2)

**Nenhuma acção necessária.** A migração é automática e não-destrutiva.

Quando a app carrega dados guardados de uma versão anterior, a função `migrateProperty()` em `store.tsx` preenche os novos campos opcionais com valores seguros:

| Campo novo          | Valor padrão   | Impacto nos dados antigos |
|---------------------|----------------|---------------------------|
| `houseType`         | `''` (vazio)   | Campo não aparece nas tags |
| `developmentId`     | `undefined`    | Tratado como "Standalone"  |
| `brochureUrl`       | `undefined`    | Sem link de brochura       |
| `imageUrl`          | `undefined`    | Sem imagem                 |
| `netMonthlyIncome`  | `0`            | Stress test desativado     |

Os dados existentes são **sempre preservados** — o spread `{ ...p }` garante que os valores guardados têm sempre prioridade.

---

## 💰 Lógica financeira (v2)

### Depósito mínimo
```
Depósito = Preço × 10%
Gap      = Depósito - (Poupança + HTB)
```

### First Home Scheme — regras reais irlandesas
```
Shortfall  = max(0, Preço - (AIP + Poupança + HTB))
FHS%       = Shortfall / Preço
Max FHS%   = 30% (sem HTB) | 20% (com HTB)
Elegível   = FHS% ≤ Max AND AIP > 0 AND (Poupança + HTB) ≥ Depósito
```

| Status   | Condição |
|----------|----------|
| 🟢 Verde  | AIP + Poupança + HTB ≥ Preço (sem FHS) |
| 🟡 Amarelo | FHS necessário e elegível (% dentro do limite) |
| 🔴 Vermelho | FHS > limite, ou AIP = 0, ou fundos insuficientes para depósito |

### Stress test bancário
```
Taxa stress         = Taxa de juros + 2%
Prestação stress    = calcMonthlyPayment(Capital, Taxa stress, Prazo)
Máx. acessível      = Renda líquida mensal × 35%

Aprovado            = Prestação stress ≤ Máx. acessível
Risco moderado      = Prestação stress ≤ Máx. acessível × 1.15
Reprovado           = Prestação stress > Máx. acessível × 1.15
```

### Fórmula da hipoteca (inalterada)
```
M = P × [ r(1+r)ⁿ ] / [ (1+r)ⁿ – 1 ]
  P = capital (€)
  r = taxa anual / 100 / 12
  n = prazo em anos × 12
```

---

## ✨ Novidades v2

| Funcionalidade | Descrição |
|----------------|-----------|
| **Empreendimentos** | Nova entidade para agrupar imóveis de um mesmo condomínio |
| **Tipo de casa** | Semi-detached, Detached, End of terrace, Mid terrace |
| **FHS real** | Regras irlandesas completas: limite 30%/20%, verificação de elegibilidade |
| **Stress test** | Teste bancário a taxa + 2%, comparado a 35% da renda |
| **Prestação vs. stress** | Comparação lado a lado na calculadora |
| **Brochura / Imagem** | Campos de URL para PDF e imagem por imóvel e por empreendimento |
| **Deploy Vercel** | `vercel.json` e instruções passo a passo |
| **Migração automática** | Dados v1 funcionam sem qualquer intervenção |

---

## 🛠️ Customizações comuns

**Alterar limite do stress test (padrão 35%):**
```ts
// src/lib/calculations.ts — função calcStressTest
const maxAffordablePayment = netMonthlyIncome * 0.35; // ← altere aqui
```

**Alterar margem de risco do stress test (padrão +15%):**
```ts
} else if (stressedMonthlyPayment <= maxAffordablePayment * 1.15) { // ← altere aqui
  result = 'risco';
```

**Alterar cap do FHS (padrão 30%):**
```ts
// src/lib/calculations.ts — função calcFHSDetail
const maxAllowedPct = htb > 0 ? 0.20 : 0.30; // ← altere aqui
```
