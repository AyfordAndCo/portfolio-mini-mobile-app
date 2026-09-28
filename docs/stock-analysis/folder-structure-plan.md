# Folder Structure Plan

**Plan ID:** SA-FS-01  
**Status:** Proposed  
**Related plan:** [Stock and ETF Analysis Implementation Plan](implementation-plan.md)  
**Repository:** Portfolio Mini Mobile App

## 1. Purpose

Organize the mobile client and market-data backend by feature so each feature's screens, data access, domain logic, and tests are easy to locate. Keep provider credentials and authoritative market-data writes on the server. Do not restructure the whole app in one change; migrate existing files as features are next implemented.

## 2. Structure principles

- Keep `App.tsx` as the application bootstrap and authentication-session gate.
- Use `app/` for navigation and screen composition. This repository does not currently use Expo Router, so file names under `app/` are not routes by convention.
- Put feature-specific components, hooks, repositories, types, and rules under `features/<feature>/`.
- Put genuinely cross-feature UI, formatting, validation, and Firebase client initialization under `shared/`.
- Put provider adapters, scheduled jobs, authoritative analysis, and privileged Firestore access in a server-only backend package.
- Mirror production responsibilities in tests, without putting server-only code in the Expo bundle.
- Create folders when implementing a feature; avoid empty placeholder directories.

## 3. Proposed target structure

```text
portfolio-mini-mobile-app/
├── App.tsx
├── app/
│   ├── navigation/
│   │   └── RootNavigator.tsx
│   └── screens/
│       ├── OverviewScreen.tsx
│       ├── DiscoverScreen.tsx
│       ├── PortfolioScreen.tsx
│       ├── AssetDetailScreen.tsx
│       ├── AlertsScreen.tsx
│       └── SettingsScreen.tsx
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── validation/
│   │   └── types/
│   ├── portfolio/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── data/
│   │   ├── domain/
│   │   └── types/
│   ├── instruments/
│   │   ├── search/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── data/
│   │   └── watchlist/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── data/
│   ├── market-data/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── data/
│   │   ├── domain/
│   │   └── types/
│   ├── stock-analysis/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── data/
│   │   └── types/
│   ├── etf-analysis/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── data/
│   │   └── types/
│   ├── portfolio-exposure/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── domain/
│   │   └── types/
│   └── alerts/
│       ├── components/
│       ├── hooks/
│       ├── data/
│       ├── validation/
│       └── types/
├── shared/
│   ├── components/
│   ├── firebase/
│   ├── formatting/
│   ├── validation/
│   └── types/
├── backend/
│   └── market-data-worker/
│       ├── src/
│       │   ├── providers/
│       │   ├── jobs/
│       │   ├── normalization/
│       │   ├── validation/
│       │   ├── persistence/
│       │   ├── analysis/
│       │   │   ├── common/
│       │   │   ├── stocks/
│       │   │   └── etfs/
│       │   ├── alerts/
│       │   └── index.ts
│       └── tests/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── firestore-rules/
│   ├── e2e/
│   └── fixtures/
│       └── market-data/
├── docs/
│   └── stock-analysis/
└── firestore.rules
```

## 4. Feature ownership

| Feature | Primary code location | Responsibility |
|---|---|---|
| Authentication | `features/auth/` | Sign-up/sign-in UI, Firebase Auth calls, credential validation and auth types |
| Holdings and portfolio summary | `features/portfolio/` | Holding forms/list, Firestore repository, live subscription, value and P/L calculations |
| Instrument search | `features/instruments/search/` | Search supported stocks/ETFs by name, ticker, exchange and currency |
| Watchlist | `features/instruments/watchlist/` | Saved instruments, target allocation, list state and persistence |
| Quotes and data freshness | `features/market-data/` | Client reads, quote presentation, source/as-of metadata and freshness states |
| Company-share analysis | `features/stock-analysis/` | Company financial, valuation, dividend, risk and announcement views |
| ETF analysis | `features/etf-analysis/` | ETF costs, distributions, holdings, concentration, exposure and overlap views |
| Portfolio exposure | `features/portfolio-exposure/` | Allocation and look-through exposure across shares and ETFs |
| Alerts | `features/alerts/` | Rule creation/editing, alert history, status and notification preferences |
| Provider ingestion and calculations | `backend/market-data-worker/` | Provider adapters, scheduled retrieval, validation, persistence, analysis and alert evaluation |
| Shared mobile services | `shared/` | Reusable UI, Firebase client, formatting, common validation and shared types |
| Verification | `tests/` and backend package tests | Unit, provider contract, Firestore rules, integration and mobile end-to-end tests |

## 5. Current-file migration map

Move code incrementally when changing the relevant feature:

| Current file | Target location |
|---|---|
| `app/AuthScreen.tsx` | `features/auth/screens/AuthScreen.tsx` |
| `app/authValidation.ts` | `features/auth/validation/authValidation.ts` |
| `app/HomeScreen.tsx` | Split screen composition into `app/screens/`; move holdings UI into `features/portfolio/components/` |
| `app/holdingsRepository.ts` | `features/portfolio/data/holdingsRepository.ts` |
| `app/portfolioCalculations.ts` | `features/portfolio/domain/portfolioCalculations.ts` |
| `components/PortfolioSummaryCard.tsx` | `features/portfolio/components/PortfolioSummaryCard.tsx` |
| `app/firebase.ts` and `app/firebaseConfig.ts` | `shared/firebase/firebaseClient.ts` and adjacent configuration module |
| `types/portfolio.ts` | `features/portfolio/types/portfolio.ts` |
| `utils/formatCurrency.ts` | `shared/formatting/formatCurrency.ts` |
| Existing tests | Keep under `tests/`, grouped by feature and test level |

During migration, update imports and tests in the same change. Do not duplicate a module in both its old and new location.

## 6. Navigation and dependency note

The current app uses `App.tsx` to switch between authentication and the home screen; it has no bottom-tab navigator or Expo Router. Before implementing the planned Overview/Discover/Portfolio/Alerts navigation, select and add a React Native navigation library. Keep screens in `app/screens/` and connect them through `app/navigation/RootNavigator.tsx`.

## 7. Backend deployment boundary

`backend/market-data-worker/` is a proposed source boundary, not a final hosting decision. It may be deployed as scheduled functions or as a managed Node.js service after provider and runtime decisions. Provider secrets, privileged Firestore writes, and ingestion jobs must remain server-side. Do not import this backend package into the Expo app.

## 8. Adoption order

1. Add shared feature conventions and migrate authentication/portfolio files only as those files change.
2. Add instrument search and watchlist.
3. Add market-data client reads and server ingestion.
4. Add separate stock and ETF detail modules.
5. Add portfolio exposure and alerts.
6. Expand test fixtures and security-rule coverage with each backend or data-model change.
