# Implementation Plan

## 1. Delivery approach

Implement this as an extension to the existing Expo/React Native TypeScript and Firebase app. Build in vertical slices, keep provider selection behind an adapter, and avoid streaming infrastructure until data rights and update needs are confirmed.

## 2. Milestones

| ID | Milestone | Main work | Exit criteria |
|---|---|---|---|
| M0 | Decisions and baseline | Confirm exchanges, watchlist, provider, latency, cost/rights, objective, alert method; inspect current app data contracts | Approved decision record and provider coverage evidence |
| M1 | Domain foundation | Add `Asset`, `Quote`, `PriceBar`, `Distribution`, `AnalysisSnapshot`, and provider mapping types; define asset identity | Same ticker on different exchanges cannot collide; types pass validation |
| M2 | Provider and ingestion | Implement adapter, secret handling, scheduled fetch, normalization, idempotent writes, sync-run records | Fixture and sandbox tests validate data mapping; stale/errors are visible |
| M3 | Data persistence/security | Add market/user collections and Firestore rules/indexes; migrate holdings to canonical asset IDs | Emulator tests prove user isolation and server-only market-data writes |
| M4 | Initial analysis | Implement common return/risk plus stock and ETF metric modules and provenance | Formula tests pass for dividends, splits, missing data, currencies, and edge cases |
| M5 | Mobile watchlist/detail | Add mixed search/watchlist and asset details, freshness states, metric explanations | End-to-end test covers add, view, stale state, and remove |
| M6 | Portfolio exposure | Add valuation, allocation, sector/currency views, ETF overlap where coverage exists | Calculations reconcile with fixture portfolios; unavailable coverage is explicit |
| M7 | Alerts | Add rules, deduplication, cooldown, history, and optional notification delivery | Trigger/retry tests show no duplicate alerts for one condition window |
| M8 | Validation and release | Historical replay, manual mobile review, privacy/security review, data-provider cost review | Acceptance checklist passes and operational monitoring is in place |

## 3. Suggested code organization

Adapt names to the repository's current conventions; avoid large restructuring for this feature.

```text
app/                         Expo routes/screens
components/                  Shared mobile components
features/stock-analysis/     UI and client query hooks
src/domain/market/           Canonical types and validation
src/domain/analysis/         Pure share and ETF calculations
functions/ or services/      Server-side ingestion and scheduled jobs
docs/stock-analysis/         Product and technical design documents
tests/                       Unit, integration, rules, and end-to-end tests
```

If the repository uses a different source layout, place server-only code in its own package/deployment unit and keep it out of the mobile bundle.

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
| JSE or international live-data access may be delayed, unavailable, licensed, or costly | Confirm coverage, entitlement, redistribution and costs before vendor commitment |
| Some providers lack consistent fundamentals, ETF holdings or corporate actions | Make each metric capability-aware; show unavailable status; keep provider adapter replaceable |
| Frequent quote writes increase Firestore cost | Persist latest quote and bounded bars; avoid storing every tick initially |
| Stale or split/unadjusted values distort returns | Store adjustment policy and quality metadata; test known corporate-action fixtures |
| Existing rules do not cover new collections | Add explicit rules and emulator tests before client release |
| Unexplained scoring can look authoritative | Start with transparent metrics; version and explain any future scorecard |

## 7. Definition of ready for coding

Begin M1 only after M0 records the supported markets, initial assets, provider options and rights, update cadence/latency, initial user objective, and data fields each selected source supplies. Score weights remain out of implementation scope until the objective is selected and can be validated.
