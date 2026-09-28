# Wireframes and UI/UX System

## 1. Navigation model

Use four primary destinations: **Overview**, **Discover**, **Portfolio**, and **Alerts**. Asset detail is a contextual screen reachable from search, a watchlist, holdings, comparison, or an alert. Settings and data-source status are reachable from the Overview profile/settings action.

## 2. Low-fidelity screen specifications

### Overview

1. Top bar: app name, portfolio selector if one exists, settings/data-status icon.
2. Portfolio summary card: total value, total return and period selector; show an unavailable state if prices are incomplete.
3. Allocation section: stocks/ETFs and sector/currency exposures; tap opens Portfolio.
4. Watchlist changes: symbol, asset type, latest value, day move, freshness badge.
5. Recent alerts/events with time and direct link to the affected asset.

### Discover

1. Search field with symbol/name suggestions and exchange identification.
2. Filter chips: All, Shares, ETFs, Exchange, Sector, Country.
3. Search result rows: instrument name, symbol, type, exchange, currency, quote status.
4. Add-to-watchlist control; avoid ambiguous ticker-only matches.
5. Optional compare tray for a small selected set.

### Asset detail — shared header

1. Name, ticker, asset type, exchange, currency.
2. Latest price, absolute/percentage move, source timestamp and freshness label.
3. Chart with period controls and volume; mark distributions/corporate actions where supported.
4. Actions: add/remove watchlist, create alert, compare.
5. Sections/tabs vary by asset type below.

### Asset detail — share sections

- Overview and price/risk.
- Company financials: reporting period and publication date visible.
- Valuation: ratio definitions and comparison basis.
- Dividends: payments, trailing yield basis, payout information availability.
- Announcements/events with source and date.
- Portfolio fit: current position, sector concentration, and related exposure.

### Asset detail — ETF sections

- Overview, return and risk.
- Fund facts: benchmark if configured, TER/fees, domicile, structure, currency.
- Distributions and history.
- Holdings: top positions and concentration with holdings-as-of date.
- Exposure: sectors, geography, currency; look-through overlap with portfolio.

### Portfolio

1. Value/return summary with calculation assumptions.
2. Holdings list with type, units, value, weight, and quote freshness.
3. Exposure summaries: asset type, sector, country, currency.
4. Concentration/ETF overlap cards with explanatory details.
5. Unpriced/unsupported holding list requiring user attention.

### Alerts

1. Active alert rules, grouped by asset, with enabled/pause control.
2. Create alert flow: choose asset, condition, threshold/window, cooldown.
3. Alert history: condition, observed value, triggered time, source, read/dismiss state.
4. Empty/error states distinguish “no alerts” from “alert data unavailable.”

## 3. Design system rules

- Use the current app's components, spacing, typography, and colour tokens where available; define new tokens only when needed.
- Format money using the asset's currency and the portfolio's display currency separately.
- Use Africa/Johannesburg for user-facing dates/times while retaining original provider timestamps.
- Pair colour with labels/icons for positive, negative, neutral, stale, and unavailable values.
- Avoid false precision: use sensible decimal places based on currency and instrument data.
- Make chart intervals, units, and adjusted/unadjusted status explicit.
- Explain technical terms inline or through accessible info affordances.
- Use loading skeletons for first load and show last-known-good data with a stale badge during outages.

## 4. Important states

- Loading, no watchlist, no portfolio, no search results.
- Quote delayed or end-of-day; stale quote; provider outage.
- Missing financials, old ETF holdings, unsupported instrument.
- Partial portfolio valuation because some positions are unpriced.
- Alert save failure, duplicate rule, disabled notification permission.
- Offline with cached values and the last successful synchronization time.

## 5. Accessibility and interaction requirements

- Support screen readers with semantic labels for asset type, price movement, freshness, chart summary, and alert condition.
- Ensure touch targets and text contrast meet the app's accessibility baseline.
- Do not encode positive/negative values by colour alone.
- Provide an accessible text summary for charts and sortable table/list content.
- Confirm destructive actions such as removing a holding; saving an alert is reversible and should be lightweight.

## 6. UX acceptance checks

- A user can distinguish a stock from an ETF in search, watchlist, portfolio, and detail views.
- Every quote and analysis summary displays an understandable as-of/freshness state.
- User can reach the source/explanation for a metric in one or two taps.
- Missing data is not rendered as zero or as a healthy indicator.
- Portfolio totals disclose excluded or unpriced holdings.
