# Stock and ETF Analysis Implementation Plan

**Plan ID:** SA-PLAN-01  
**Status:** Draft  
**Related:** [Folder Structure Plan (SA-FS-01)](folder-structure-plan.md)

## 1. Delivery approach

Implement this as an extension to the existing Expo/React Native TypeScript and Firebase app. Build in vertical slices, keep provider selection behind an adapter, and avoid streaming infrastructure until data rights and update needs are confirmed.

## 2. Milestones

| ID | Milestone | Main work | Exit criteria |
|---|---|---|---|
| M0 | Decisions and baseline | JSE-listed shares and ETFs are approved for v1; select a covered provider, confirm latency, rights, cost, objective, alert method, and inspect current app data contracts | Approved provider decision and coverage evidence; deferred US/global scope is tracked in [issue #12](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/12) |
| M1 | Domain foundation | Add `Asset`, `Quote`, `PriceBar`, `Distribution`, `AnalysisSnapshot`, and provider mapping types; define asset identity | Same ticker on different exchanges cannot collide; types pass validation |
| M2 | Provider and ingestion | Implement adapter, secret handling, scheduled fetch, normalization, idempotent writes, sync-run records | Fixture and sandbox tests validate data mapping; stale/errors are visible |
| M3 | Data persistence/security | Add market/user collections and Firestore rules/indexes; migrate holdings to canonical asset IDs | Emulator tests prove user isolation and server-only market-data writes |
| M4 | Initial analysis | Implement common return/risk plus stock and ETF metric modules and provenance | Formula tests pass for dividends, splits, missing data, currencies, and edge cases |
| M5 | Mobile search/watchlist/detail | Add JSE share and ETF search, user-specific watchlists, asset details, freshness states, and metric explanations | End-to-end test covers search, add/remove, source and stale states |
| M6 | Portfolio exposure | Add valuation, allocation, sector/currency views, ETF overlap where coverage exists | Calculations reconcile with fixture portfolios; unavailable coverage is explicit |
| M7 | Alerts | Add rules, deduplication, cooldown, history, and optional notification delivery | Trigger/retry tests show no duplicate alerts for one condition window |
| M8 | Validation and release | Historical replay, manual mobile review, privacy/security review, data-provider cost review | Acceptance checklist passes and operational monitoring is in place |

### GitHub issue mapping

The feature work is tracked in [Project 12](https://github.com/orgs/AyfordAndCo/projects/12/views/1).

| Milestone | GitHub issue(s) |
|---|---|
| M0 — Provider, licensing, and refresh decision | [#13](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/13) |
| M1 — Domain contracts | [#14](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/14) |
| M2 — Scheduled ingestion | [#15](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/15) |
| M3 — Firestore and security | [#16](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/16) |
| M4 — Company-share and ETF analysis | [#18](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/18), [#19](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/19) |
| M5 — Search, watchlist, freshness | [#17](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/17), [#22](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/22), [#20](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/20) |
| M6 — Portfolio exposure | [#21](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/21) |
| M7 — Alerts | [#23](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/23) |
| M8 — Validation and release | [#24](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/24) |
| Deferred US/global coverage | [#12](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/12) |

## 3. Planned folder structure and milestone mapping

Use the feature-oriented structure in [Folder Structure Plan (SA-FS-01)](folder-structure-plan.md). Keep `App.tsx` as the bootstrap, use `app/navigation/` and `app/screens/` for navigation and screen composition, and place feature logic in `features/<feature>/`. Server-side provider access, analysis and privileged Firestore writes belong in `backend/market-data-worker/`; shared UI and client setup belong in `shared/`.

Implement the structure incrementally. Do not move every existing file before feature work begins. Migrate a file when that feature is changed and update its imports/tests in the same change.

| Milestone | Main folder impact |
|---|---|
| M0 — Decisions and baseline | JSE share/ETF scope is fixed for v1; confirm provider/hosting approach, latency, licensing, alert method, and analysis objective |
| M1 — Domain foundation | Establish `features/market-data/types/`, canonical instrument types and shared validation conventions |
| M2 — Provider and ingestion | Create `backend/market-data-worker/src/providers/`, `jobs/`, `normalization/`, `validation/` and `persistence/` |
| M3 — Data persistence/security | Add Firestore paths/rules; place client reads in feature `data/` modules and rules tests in `tests/firestore-rules/` |
| M4 — Initial analysis | Add backend `analysis/common/`, `analysis/stocks/`, and `analysis/etfs/`; keep formula tests with backend/unit test coverage |
| M5 — Mobile watchlist/detail | Add `features/instruments/search/`, `features/instruments/watchlist/`, `features/stock-analysis/`, `features/etf-analysis/`, and app screen/navigation composition |
| M6 — Portfolio exposure | Add `features/portfolio-exposure/` and its calculation tests |
| M7 — Alerts | Add `features/alerts/` and backend `alerts/` evaluation |
| M8 — Validation and release | Complete `tests/unit/`, `integration/`, `e2e/`, `fixtures/market-data/`, monitoring and release checks |

The current application has no tab-navigation library. Select and add one before implementing `app/navigation/RootNavigator.tsx`; folders under `app/` are not routes unless the project deliberately adopts Expo Router.

## 4. Testing strategy

- **Unit:** return, yield, adjusted price, volatility, drawdown, allocation, overlap, thresholds, and data-quality gates.
- **Contract:** provider fixtures map to canonical DTOs; unknown fields and errors do not break ingestion.
- **Integration:** idempotent writes, retry behavior, source provenance, and alert deduplication.
- **Firestore rules:** owner can access own holdings/watchlist/rules/alerts; cannot access another user's data; clients cannot write shared market data/analysis.
- **Mobile UI:** stock/ETF distinction, loading/empty/stale/offline/error states, and accessible labels.
- **End-to-end:** add watchlist asset, refresh/load analysis, create alert, trigger fixture event, view alert.
- **Historical validation:** no look-ahead from future financial publications; corporate actions/distributions handled consistently.

## 5. Operational requirements

- Provider secrets server-side only; no secrets in Expo public environment variables or logs.
- Track provider request count, quota/rate-limit errors, sync duration, last successful data timestamp, and Firestore write volume.
- Alerts and scheduled jobs must be retry-safe and idempotent.
- Display provider status and last successful sync in the app.
- Define a manual pause switch for ingestion and a safe stale-data mode.
- Review data licensing and redistribution terms for app display before enabling live data.

## 6. Dependencies and risks

| Dependency/risk | Response |
|---|---|
| JSE live-data access and international ETF look-through fields may be delayed, unavailable, licensed, or costly | Confirm coverage, entitlement, redistribution and costs before vendor commitment; keep direct US/global listing support in [issue #12](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/12) |
| Some providers lack consistent fundamentals, ETF holdings or corporate actions | Make each metric capability-aware; show unavailable status; keep provider adapter replaceable |
| Frequent quote writes increase Firestore cost | Persist latest quote and bounded bars; avoid storing every tick initially |
| Stale or split/unadjusted values distort returns | Store adjustment policy and quality metadata; test known corporate-action fixtures |
| Existing rules do not cover new collections | Add explicit rules and emulator tests before client release |
| Unexplained scoring can look authoritative | Start with transparent metrics; version and explain any future scorecard |

## 7. Definition of ready for coding

Begin M1 after M0 records provider options and rights, update cadence/latency, initial analysis objective, and the data fields each selected source supplies. The M0 decision record is maintained in [JSE market-data provider decision](provider-decision.md). The v1 market scope is JSE-listed ordinary shares and ETFs; direct US-listed securities and broader global exchange support are deferred in [issue #12](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/12). Score weights remain out of implementation scope until the objective is selected and can be validated.
