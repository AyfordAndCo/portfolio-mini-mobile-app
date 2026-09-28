# Database Design

## 1. Design goals

- Separate shared instrument/market data from user-private portfolio data.
- Identify instruments by exchange-aware stable IDs, not ticker alone.
- Preserve source and effective timestamps for auditability and freshness.
- Keep Firestore documents bounded; place time series and repeated events in subcollections.
- Restrict trusted market and analysis writes to server-side code.

## 2. Proposed Firestore layout

| Path | Owner / writer | Purpose |
|---|---|---|
| `marketAssets/{assetId}` | Backend; client read by policy | Canonical instrument identity and supported type |
| `marketAssets/{assetId}/quotes/latest` | Backend only | Latest validated quote and freshness |
| `marketAssets/{assetId}/priceBars/{barId}` | Backend only | Historical OHLCV bars |
| `marketAssets/{assetId}/fundamentals/{periodId}` | Backend only | Company financial-period facts |
| `marketAssets/{assetId}/fundFacts/{factId}` | Backend only | ETF fees, structure and classification facts |
| `marketAssets/{assetId}/distributions/{eventId}` | Backend only | Dividend/distribution records |
| `marketAssets/{assetId}/holdings/{holdingId}` | Backend only | Point-in-time ETF constituent holdings |
| `marketAssets/{assetId}/events/{eventId}` | Backend only | Results, announcements, splits and corporate actions |
| `marketAssets/{assetId}/analysis/latest` | Backend only; client read by policy | Latest shared analysis and explanations |
| `users/{uid}/holdings/{holdingId}` | User owner | Existing user portfolio positions |
| `users/{uid}/watchlist/{assetId}` | User owner | Saved assets and optional target allocation |
| `users/{uid}/alertRules/{ruleId}` | User owner | Alert conditions and preferences |
| `users/{uid}/alerts/{alertId}` | Backend create; owner read/update status | Trigger history and read/dismiss state |
| `system/providerSyncRuns/{runId}` | Backend/admin only | Job outcomes and provider health metadata |

The existing `users/{uid}/holdings` and `users/{uid}/portfolioMeta` paths remain the portfolio source of truth. Add optional `assetId` to holdings through a migration; preserve current records during migration.

## 3. Document fields

### `marketAssets/{assetId}`

```ts
{
  assetId: string;                 // stable canonical ID, e.g. exchange:symbol
  symbol: string;
  exchange: string;               // exchange/MIC code when available
  assetType: 'STOCK' | 'ETF';
  name: string;
  currency: string;               // ISO 4217
  country?: string;
  sector?: string;
  providerMappings: Record<string, string>;
  active: boolean;
  updatedAt: Timestamp;
}
```

### `quotes/latest`

```ts
{
  price: number;
  currency: string;
  providerTimestamp: Timestamp;
  receivedAt: Timestamp;
  source: string;
  marketStatus: 'LIVE' | 'DELAYED' | 'END_OF_DAY' | 'UNKNOWN';
  qualityStatus: 'VALID' | 'STALE' | 'CONFLICTING';
  previousClose?: number;
  volume?: number;
  providerRequestId?: string;
}
```

### `priceBars/{barId}`

```ts
{
  interval: '1D' | '1H' | '15M' | '5M' | '1M';
  startAt: Timestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  currency: string;
  adjusted: boolean;
  source: string;
  receivedAt: Timestamp;
  qualityStatus: string;
}
```

Use deterministic `barId` from interval and exchange-local interval start. Define adjustment method and timezone policy before ingestion.

### `fundamentals/{periodId}` and `fundFacts/{factId}`

Store typed values, unit/currency, fiscal/effective period, publication date, retrieval time, source, and quality status. Avoid untyped numeric maps whose units cannot be understood later.

### `analysis/latest`

```ts
{
  assetId: string;
  assetType: 'STOCK' | 'ETF';
  calculatedAt: Timestamp;
  asOf: Timestamp;
  algorithmVersion: string;
  inputRefs: string[];
  categories: Record<string, { value?: number; status: string; explanation: string }>;
  overallScore?: number;          // absent until scorecard is approved
  warnings: string[];
}
```

### `users/{uid}/watchlist/{assetId}`

```ts
{
  assetId: string;
  addedAt: Timestamp;
  targetAllocationPct?: number;
  notes?: string;
  enabled: boolean;
}
```

### `users/{uid}/alertRules/{ruleId}`

```ts
{
  assetId: string;
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PCT_MOVE' | 'NEW_DISTRIBUTION' | 'NEW_EVENT' | 'DATA_STALE';
  threshold?: number;
  window?: string;
  cooldownMinutes: number;
  enabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 4. Security rules and access

Current Firestore rules cover holdings and portfolio metadata only. Before adding client reads/writes:

- Allow users to read/write only their own watchlist and alert rules.
- Allow users to read only their own holdings/alerts.
- Deny client writes to all `marketAssets` and `system` paths.
- Allow only the server/Admin SDK to write canonical quotes, fundamentals, analysis, and alert triggers.
- Decide whether market analysis is readable to every authenticated user or only through a backend API, based on provider redistribution terms.
- Add Firebase Emulator tests for both authorized and unauthorized paths.

## 5. Query and cost notes

- Query watchlist and holdings by user subcollection; fetch batched `latest` quote docs by asset IDs.
- Paginate bars by `startAt`; avoid unbounded subcollection reads.
- Persist only selected intervals and latest quote in the first release; do not write every streaming tick.
- Add composite indexes only for concrete query patterns and keep an index manifest with the code.
- Establish retention/archival policy for high-frequency bars, raw responses, and sync logs.
