# UML Models

## 1. Use cases

**Portfolio owner**

- Manage a mixed stock/ETF watchlist.
- Inspect asset details and data freshness.
- Compare assets and review portfolio exposures.
- Create and manage alerts.
- View, dismiss, or revisit alert history.

**Ingestion worker**

- Synchronize provider data.
- Validate and persist market inputs.
- Run asset-specific analysis.
- Evaluate and deduplicate alert rules.
- Record sync health and errors.

## 2. Domain class diagram

```mermaid
classDiagram
    class Asset {
      +assetId: string
      +symbol: string
      +exchange: string
      +currency: string
      +assetType: STOCK|ETF
    }
    class Quote {
      +price: number
      +providerTimestamp: Date
      +receivedAt: Date
      +marketStatus: string
      +qualityStatus: string
    }
    class PriceBar {
      +interval: string
      +startAt: Date
      +open: number
      +high: number
      +low: number
      +close: number
      +volume: number
    }
    class AnalysisSnapshot {
      +calculatedAt: Date
      +algorithmVersion: string
      +categories: object
      +warnings: string[]
    }
    class Holding {
      +holdingId: string
      +units: number
      +costBasis: number
      +acquiredAt: Date
    }
    class AlertRule {
      +ruleId: string
      +type: string
      +threshold: number
      +enabled: boolean
    }
    class Alert {
      +alertId: string
      +triggeredAt: Date
      +observedValue: number
      +status: string
    }
    Asset "1" --> "0..1" Quote : latest
    Asset "1" --> "0..*" PriceBar : history
    Asset "1" --> "0..*" AnalysisSnapshot : analysis
    Holding "*" --> "1" Asset : references
    AlertRule "*" --> "1" Asset : watches
    Alert "*" --> "1" AlertRule : triggered by
```

## 3. Analysis activity

```mermaid
flowchart TD
    A["Receive provider data"] --> B["Resolve canonical asset"]
    B --> C["Validate identity, time, currency, and values"]
    C --> D{"Inputs valid and fresh?"}
    D -->|No| E["Persist quality state; suppress affected metrics"]
    D -->|Yes| F["Normalize and persist inputs"]
    F --> G{"Asset type"}
    G -->|Stock| H["Run company analysis"]
    G -->|ETF| I["Run fund and holdings analysis"]
    H --> J["Save versioned analysis"]
    I --> J
    E --> J
    J --> K["Evaluate and deduplicate alerts"]
```

## 4. Quote update sequence

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant W as Ingestion Worker
    participant P as Provider
    participant D as Firestore
    participant A as Analysis Engine
    S->>W: Start scheduled sync
    W->>P: Request quote and required facts
    P-->>W: Provider response with timestamps
    W->>W: Normalize and validate
    W->>D: Upsert canonical market data
    W->>A: Analyze changed asset
    A->>D: Save versioned metrics and alerts
```
