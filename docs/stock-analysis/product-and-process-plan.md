# Product and Process Plan

**Status:** Draft  
**Product:** Portfolio Mini Mobile App  
**Feature:** Stock and ETF Analysis

## 1. Purpose

Extend the portfolio app so a user can review market and company/fund information for individual shares and ETFs, monitor portfolio exposure, and receive explainable alerts. The system is a research aid; it does not execute trades or promise returns.

## 2. Product outcomes

- Track a mixed watchlist of shares and ETFs.
- Show prices with source, currency, timestamp, and live/delayed/end-of-day status.
- Present asset-type-specific performance, income, valuation/fund, and risk information.
- Relate assets to holdings, allocation, concentration, and overlap in the user's portfolio.
- Alert on configured events and data-quality issues with a clear explanation.
- Make every metric traceable to input data and calculation/model version.

## 3. Scope

### Initial release

- Search/add/remove supported instruments in a watchlist.
- Support individual common shares and ETFs. Instrument identity includes exchange and currency, not ticker alone.
- Store latest validated quote and a defined historical price series.
- Calculate price return, total return when distributions/corporate actions are available, volatility, drawdown, holdings allocation, and basic income metrics.
- Show company metrics for shares and fund/holdings metrics for ETFs.
- Show stale, delayed, missing, or conflicting data states.
- Provide user-configurable threshold alerts; no order entry.

### Later releases

- True streaming quotes if data licensing, vendor coverage, cost, and infrastructure justify them.
- Company and fund event ingestion, richer peer comparisons, dividend sustainability and ETF holdings look-through.
- Configurable, versioned category scores after objectives and data coverage are agreed.
- Historical replay/backtesting of analysis rules.

### Out of scope for the initial release

- Brokerage connection, trade execution, tax advice, guaranteed forecasts, autonomous buy/sell decisions, and unverified AI-generated financial claims.

## 4. Users and primary use cases

**Primary actor:** authenticated portfolio owner.

- Manage holdings and a mixed stock/ETF watchlist.
- Inspect an asset's price, history, relevant financial/fund facts, and data freshness.
- Compare selected assets using the same metric definitions where comparison is valid.
- Review portfolio concentration and ETF holdings overlap.
- Create, pause, or delete alerts and inspect alert history.

**System actor:** ingestion/analysis worker.

- Retrieve provider data, normalize and validate it, update market records, run affected analyses, and emit deduplicated alerts.

## 5. Process plan

1. **Confirm decisions:** supported exchanges and instrument types; first watchlist; provider and usage rights; definition of live; update budget; initial analysis objective; alert delivery method.
2. **Specify data contracts:** provider-neutral asset, quote, bar, financial/fund fact, event, and source metadata models.
3. **Build ingestion foundation:** provider adapter, authentication secret handling, rate limiting, retries, idempotency, validation, run logging, and freshness state.
4. **Build analysis modules:** shared return/risk calculations; separate company-share and ETF analysis; data-quality gates and explanation generation.
5. **Build read experience:** overview, discover, asset detail, portfolio exposure, and alerts screens.
6. **Validate:** unit tests for formulas, integration tests for provider normalization and persistence, security rules tests, and historical scenario review.
7. **Release incrementally:** begin with scheduled/delayed quotes and transparent timestamps. Enable streaming only after provider entitlement and a measured need are established.

## 6. Product rules

- Never label a price “live” unless the provider contract and returned metadata support that label.
- Never interpret missing data as zero.
- Never show an aggregate score without the category breakdown, input freshness, and model version.
- Stock and ETF metrics must be type-appropriate; company ratios are not applied to ETF units.
- Portfolio calculations use explicit transaction/cost basis assumptions and report when required inputs are missing.
- Alerts explain the exact condition, observed value, timestamp, and source.

## 7. Open decisions

| Decision | Required outcome | Gate |
|---|---|---|
| Market coverage | Initial exchanges and supported instruments | Before provider selection |
| Data provider | Quote, historical, fundamental, distribution, and event coverage; fees and use rights | Before ingestion implementation |
| Live definition | Streaming, polling interval, or delayed/end-of-day acceptable | Before UI freshness labels are finalized |
| Initial objective | General research, income, growth, or another objective | Before scoring weights |
| Alerts | In-app only or push notifications | Before alert delivery implementation |
| Data retention | Historical bars and source response retention periods | Before production deployment |

## 8. Success measures

- Supported instruments resolve unambiguously by exchange and currency.
- Every displayed market-derived metric has a source timestamp and freshness status.
- Formula tests cover positive, negative, missing, split-adjusted, and distribution cases.
- Users can see why an analysis value changed.
- User-private holdings and alert settings are inaccessible to other users.
