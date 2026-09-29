# Architecture Overview

**Status:** Target architecture approved for incremental adoption  
**Style:** Monorepo + Clean Architecture + explicit application boundaries

## 1. Architectural intent

The repository will evolve from a single Expo application into a monorepo containing independently deployable applications and reusable packages.

The design goals are:

- separate mobile, web, backend, worker, and future delivery applications;
- keep business rules independent of Expo, React, Firebase, HTTP, databases, and provider SDKs;
- make use cases testable without network or framework dependencies;
- keep infrastructure replaceable behind interfaces;
- prevent server-only secrets and privileged code from entering client bundles;
- reuse domain and application behavior across mobile, web, backend jobs, and tests;
- migrate incrementally without stopping feature delivery.

## 2. Top-level structure

```text
portfolio-mini-mobile-app/
├── apps/
│   ├── mobile/
│   ├── web/
│   ├── api/
│   └── market-data-worker/
│
├── packages/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── contracts/
│   ├── config/
│   └── testing/
│
├── docs/
├── tooling/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

Applications are executable/deployable entry points.

Packages are reusable libraries and must not behave like independent applications.

## 3. Application boundaries

### `apps/mobile`

Expo / React Native application.

Responsibilities:

- navigation;
- screens and presentation state;
- mobile-specific UI components;
- authentication session wiring;
- mobile composition root;
- dependency injection/composition;
- invoking application use cases;
- translating application results into UI state.

Must not contain:

- provider credentials;
- privileged Firestore writes;
- market-data ingestion;
- canonical business rules;
- direct provider API calls.

### `apps/web`

Future web application.

Responsibilities mirror the mobile delivery layer:

- browser routing;
- web presentation;
- web-specific composition;
- invocation of shared application use cases or backend APIs.

The web app must not become a second copy of domain/application logic.

### `apps/api`

Server-side API / command boundary.

Responsibilities:

- authenticated HTTP/API endpoints;
- server-side composition root;
- authorization at the delivery boundary;
- request/response mapping;
- invocation of application use cases;
- wiring repositories, external services, persistence, and logging.

### `apps/market-data-worker`

Background/scheduled server process.

Responsibilities:

- scheduled ingestion;
- provider synchronization;
- normalization orchestration;
- analysis jobs;
- alert evaluation;
- operational job monitoring.

Provider secrets and privileged writes remain here or in other server-only applications.

## 4. Package boundaries

### `packages/domain`

The innermost layer.

Contains:

- entities;
- value objects;
- domain types;
- domain services;
- pure calculations;
- invariants;
- domain errors;
- repository/service interfaces when they express domain needs.

Examples:

```text
packages/domain/src/
├── portfolio/
│   ├── entities/
│   ├── value-objects/
│   ├── calculations/
│   └── repositories/
├── instruments/
├── market-data/
├── stock-analysis/
├── etf-analysis/
├── alerts/
└── shared/
```

Allowed dependencies:

- TypeScript;
- other modules inside `domain`;
- small framework-free utility packages only when justified.

Forbidden dependencies:

- React;
- React Native;
- Expo;
- Firebase;
- Express;
- Next.js;
- database SDKs;
- provider SDKs;
- Node runtime APIs unless unavoidable and isolated.

### `packages/application`

Coordinates business use cases.

Contains:

- use cases;
- commands/queries;
- ports/interfaces required by use cases;
- application DTOs;
- application validation;
- orchestration logic;
- transaction boundaries.

Examples:

```text
packages/application/src/
├── portfolio/
│   └── use-cases/
├── instruments/
├── market-data/
├── analysis/
├── watchlist/
└── alerts/
```

Examples of use cases:

- `AddHolding`
- `UpdateHolding`
- `DeleteHolding`
- `SearchInstruments`
- `AddToWatchlist`
- `GetPortfolioSummary`
- `EvaluatePriceAlerts`
- `IngestMarketData`

Allowed dependencies:

- `@portfolio/domain`;
- `@portfolio/contracts` when transport-neutral contracts are required.

Forbidden dependencies:

- Firebase;
- React;
- Expo;
- Express;
- database implementations;
- provider SDKs.

### `packages/infrastructure`

Implements technical details required by application/domain ports.

Contains:

- Firestore repositories;
- Firebase Auth adapters;
- market-data provider adapters;
- HTTP clients;
- persistence mappers;
- logging adapters;
- notification adapters;
- scheduler-specific adapters if reusable.

Example:

```text
packages/infrastructure/src/
├── firebase/
│   ├── FirestoreHoldingsRepository.ts
│   └── FirebaseAuthGateway.ts
├── market-data/
│   └── providers/
├── notifications/
└── observability/
```

Infrastructure may depend inward on application/domain contracts.

Domain and application must never import infrastructure.

### `packages/contracts`

Cross-boundary schemas and stable data contracts.

Contains:

- API request/response schemas;
- canonical market-data schemas shared between processes;
- event payloads;
- serialization-safe DTOs.

Keep contracts transport-neutral where possible.

Do not place business logic here.

### `packages/config`

Shared configuration helpers and environment schema definitions.

Rules:

- server secret definitions must not be imported into client applications;
- expose separate client-safe and server-only modules;
- validation happens at application startup.

### `packages/testing`

Reusable fixtures, builders, fakes, and test helpers.

Examples:

- portfolio builders;
- fake repositories;
- market-data fixtures;
- deterministic clock;
- provider fixture loaders.

Production code must never depend on `packages/testing`.

## 5. Dependency rule

Dependencies point inward:

```text
Delivery / Frameworks
apps/mobile   apps/web   apps/api   apps/market-data-worker
       \        |         |          /
                v
       packages/infrastructure
                |
                v
        packages/application
                |
                v
           packages/domain
```

A more precise rule:

- `domain` depends on nothing outside the core;
- `application` may depend on `domain`;
- `infrastructure` may depend on `application` and `domain`;
- apps may depend on all required packages;
- dependencies must never point from an inner layer to an outer layer.

## 6. Composition roots

Concrete implementations are selected only at application startup.

Examples:

```ts
const holdingsRepository = new FirestoreHoldingsRepository(db);

const addHolding = new AddHolding({
  holdingsRepository,
});

renderMobileApp({
  addHolding,
});
```

The use case knows the repository interface, not Firestore.

The app knows which concrete adapter to construct.

## 7. Feature organization inside layers

Use feature-oriented modules inside each architectural layer.

Prefer:

```text
packages/domain/src/portfolio/
packages/application/src/portfolio/
packages/infrastructure/src/portfolio/
```

over large technical dumping grounds such as:

```text
domain/entities/
application/use-cases/
infrastructure/repositories/
```

Feature grouping keeps related behavior easy to locate while preserving layer boundaries.

## 8. Data ownership

### User-private data

Examples:

- holdings;
- watchlists;
- alert rules;
- preferences.

Access must be owner-scoped.

### Shared authoritative market data

Examples:

- instruments;
- quotes;
- distributions;
- holdings for ETFs;
- provider metadata;
- analysis snapshots.

Clients may read only what policy allows.

Clients must not perform privileged writes.

### Application-generated analysis

Derived values must remain traceable to:

- input data;
- source;
- as-of timestamps;
- calculation version.

## 9. Cross-application reuse

Shared code belongs in packages only when it is truly reusable.

Good candidates:

- portfolio calculations;
- canonical instrument identity;
- validation rules;
- use cases;
- provider-independent interfaces;
- API contracts.

Bad candidates:

- React Native components;
- Next.js page components;
- Express middleware;
- Expo navigation;
- environment-specific startup logic.

## 10. Enforcement

The architecture should be enforced using:

- TypeScript project references or package boundaries;
- workspace package exports;
- ESLint import restrictions;
- no relative imports across package boundaries;
- CI architecture checks;
- package-level tests.

Example dependency policy:

```text
domain          -> none
application     -> domain, contracts
infrastructure  -> application, domain, contracts, config
mobile          -> application, domain, infrastructure(client-safe), contracts, config(client)
web             -> application, domain, infrastructure(client-safe), contracts, config(client)
api             -> application, domain, infrastructure, contracts, config(server)
worker          -> application, domain, infrastructure, contracts, config(server)
```

## 11. Migration principle

Do not rewrite the existing application all at once.

Every feature change should leave the touched area closer to the target architecture.

The detailed sequence is documented in:

- `docs/architecture/clean-architecture-migration.md`

