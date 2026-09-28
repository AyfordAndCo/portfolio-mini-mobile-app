# Analysis Algorithm

## 1. Design principles

- Use deterministic, documented calculations for the first release.
- Keep data acquisition separate from calculations and presentation.
- Analyse individual shares and ETFs with distinct modules.
- Preserve source timestamps, currency, data quality, and model version.
- Report “insufficient data” rather than fabricating a value.
- Treat outputs as descriptive research signals, not guaranteed forecasts or personalized trade instructions.

## 2. Processing workflow

1. Resolve a requested instrument by stable `assetId`, exchange, and currency.
2. Load validated quote, bars, corporate actions/distributions, and asset-specific facts.
3. Validate identity, units, timestamp, source, currency, and required history.
4. Normalize provider values into canonical units and timezone-aware timestamps.
5. Adjust price series consistently for splits and other supported corporate actions.
6. Calculate common price and risk metrics.
7. Dispatch to `StockAnalysis` or `EtfAnalysis` based on asset type.
8. Apply data-quality gates; suppress metrics whose inputs fail the gate.
9. Compare current metrics with prior analysis and configured alert rules.
10. Persist output with input references, calculation time, and algorithm version.
11. Return a result with metric values, explanations, freshness, and caveats.

## 3. Shared calculations

### Simple price return

For prices (P_0) and (P_1), price return is `(P1 / P0) - 1`. The period and price adjustment policy must be included in the result.

### Total return

Use a documented total-return series or calculate from adjusted prices and distributions only when the provider's adjustment conventions are known. Do not add distributions to an already distribution-adjusted series a second time.

### Volatility and drawdown

Use a specified return frequency and lookback window. Annualization assumptions must be explicit. Maximum drawdown is the largest peak-to-subsequent-trough decline in the selected period.

### Portfolio allocation

Position value is units multiplied by a valid quote, converted to the selected portfolio currency using a timestamped FX rate when needed. Allocation is position value divided by portfolio value. Clearly identify unpriced holdings and excluded values.

## 4. Individual share module

Analyze and report independent categories:

- **Price and activity:** period returns, trend indicators, volume comparison, volatility, and drawdown.
- **Financial strength:** revenue/earnings/cash-flow trends, leverage, liquidity, and profitability where reported consistently.
- **Valuation:** applicable ratios compared with the company's own history or an appropriate peer group; disclose peer limitations.
- **Income:** trailing distributions, yield using a stated price date, payment consistency, payout support from earnings/cash flow when available.
- **Events:** results, SENS/company announcements, corporate actions, and other licensed/source-attributed events.
- **Portfolio fit:** position size, sector concentration, currency exposure, and correlation only when adequate history exists.

Financial periods must be tagged with fiscal period and publication date. Do not treat a later-published result as if it were known earlier in historical replay.

## 5. ETF module

Report independent categories:

- **Price and performance:** price/total returns, volatility, drawdown, and benchmark comparison only if a suitable benchmark is selected.
- **Income:** distribution history, trailing yield, and distribution variability; label yield as historical, not guaranteed.
- **Cost and structure:** expense ratio/TER and other disclosed fund costs, fund type, domicile, and currency where available.
- **Diversification:** number of holdings, top holdings concentration, sector/geography/currency mix, and concentration measures when holdings data is current.
- **Portfolio fit:** overlap with other ETF holdings and look-through exposure to held shares, with holdings-as-of timestamp.

An ETF with unavailable holdings data can still show market metrics but must mark look-through analysis as unavailable or stale.

## 6. Scores and decision labels

The initial release should show metrics and category summaries without a single cross-asset ranking. Later scoring should:

- Define separate scorecards for shares and ETFs.
- Map each metric to a bounded scale using documented thresholds or peer-relative normalization.
- Define treatment of missing data; do not renormalize silently in a way that makes incomplete assets look stronger.
- Store scorecard version, inputs, category weights, and explanations.
- Validate against out-of-sample historical periods and changing market conditions.
- Use neutral labels such as “stronger/weaker on this measure” rather than deterministic “buy/sell” commands.

Weights and any overall score are deliberately undecided until the user's analysis objective and provider coverage are selected.

## 7. Data quality gates

Each input receives `qualityStatus`: `valid`, `stale`, `missing`, `conflicting`, or `unsupported`. Freshness thresholds are configured per data type and exchange session. Reject impossible prices, negative volume, malformed currency, duplicate bars, future timestamps outside an allowed clock-skew tolerance, and provider records for a mismatched instrument.

If a required input fails, the associated metric is omitted or labeled unavailable. Derived values carry the IDs/timestamps of the source records used.

## 8. Alert evaluation

Evaluate alerts only after a new valid data point or event is persisted. Supported initial rules: percentage/absolute price threshold, distribution/event arrival, and data-stale condition. Deduplicate by `(userId, ruleId, triggerWindow)` and retain the observed value and source snapshot. Apply a user-configurable cooldown and do not notify repeatedly while the same condition remains true.

## 9. Pseudocode

```text
analyze(assetId):
  asset = loadAsset(assetId)
  inputs = loadLatestValidatedInputs(assetId)
  quality = validate(inputs, freshnessPolicy(asset.exchange))
  common = calculateCommonMetrics(inputs.prices, inputs.actions)

  if asset.type == STOCK:
    specific = calculateStockMetrics(inputs.fundamentals, inputs.dividends, inputs.events)
  else if asset.type == ETF:
    specific = calculateEtfMetrics(inputs.fundFacts, inputs.holdings, inputs.distributions)
  else:
    return unsupportedAssetResult(asset)

  result = omitMetricsWithFailedInputs(common + specific, quality)
  result.attach(provenance, asOf, algorithmVersion, explanations)
  saveAnalysis(result)
  evaluateAlerts(result)
  return result
```
