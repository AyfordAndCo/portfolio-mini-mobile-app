# Clean Architecture Migration Plan

**Status:** Planned  
**Migration strategy:** Incremental, feature-by-feature  
**Target:** pnpm monorepo with independently deployable apps and reusable Clean Architecture packages

## 1. Why migrate

The current application is small enough to change safely, but current screens directly coordinate Firebase, repositories, validation, and UI behavior.

Upcoming market-data, search, watchlist, analysis, exposure, alert, and backend work will multiply these dependencies.

Migrating before those features expand prevents:

- framework-specific business logic;
- duplicated mobile/web behavior;
- Firebase coupling across the codebase;
- provider SDKs leaking into business logic;
- large screens becoming orchestration layers;
- server-only code entering client bundles;
- expensive restructuring after the MVP grows.

## 2. Current-to-target mapping

| Current | Target |
|---|---|
| `App.tsx` | `apps/mobile/src/App.tsx` |
| `app/AuthScreen.tsx` | `apps/mobile/src/features/auth/AuthScreen.tsx` or presentation module |
| `app/HomeScreen.tsx` | split across mobile presentation + portfolio application use cases |
| `app/authValidation.ts` | domain/application validation package depending on rule ownership |
| `app/firebase.ts` | client composition under `apps/mobile` plus reusable adapters in `packages/infrastructure` |
| `app/firebaseConfig.ts` | `packages/config` client-safe configuration |
| `app/holdingsRepository.ts` | interface in core + Firestore implementation in `packages/infrastructure` |
| `app/portfolioCalculations.ts` | `packages/domain/src/portfolio/calculations/` |
| `types/portfolio.ts` | `packages/domain/src/portfolio/` |
| `components/PortfolioSummaryCard.tsx` | `apps/mobile/src/features/portfolio/components/` |
| `utils/formatCurrency.ts` | mobile/shared presentation utility; not domain |
| future ingestion | `apps/market-data-worker` |
| future HTTP API | `apps/api` |
| future web UI | `apps/web` |

## 3. Target repository

```text
.
├── apps/
│   ├── mobile/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── features/
│   │   │   └── composition/
│   │   ├── app.json
│   │   └── package.json
│   │
│   ├── web/
│   │   └── ...
│   │
│   ├── api/
│   │   └── src/
│   │
│   └── market-data-worker/
│       └── src/
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

Create only applications that are actually needed. Empty future app directories are not required.

## 4. Migration phases

### Phase 0 — Guardrails

Goal: establish boundaries before moving behavior.

Tasks:

- [ ] Add `pnpm-workspace.yaml`.
- [ ] Add root workspace scripts.
- [ ] Add `tsconfig.base.json`.
- [ ] Define workspace package naming, e.g. `@portfolio/domain`.
- [ ] Define package export rules.
- [ ] Add lint/import restrictions for dependency direction.
- [ ] Update CI to install and validate the workspace.
- [ ] Keep the current Expo application running during the transition.

Exit criteria:

- workspace bootstraps successfully;
- existing tests still pass;
- CI detects illegal package dependency direction.

### Phase 1 — Extract domain

Goal: move pure business logic out of the app first.

Move:

- portfolio entities/types;
- portfolio calculations;
- canonical instrument identity as it is introduced;
- quote/value objects;
- business validation that does not depend on UI or infrastructure.

Initial target:

```text
packages/domain/src/portfolio/
├── entities/
├── value-objects/
├── calculations/
└── repositories/
```

Tasks:

- [ ] Create `packages/domain`.
- [ ] Move portfolio types into domain.
- [ ] Move `portfolioCalculations.ts`.
- [ ] Add domain-level tests.
- [ ] Define repository interfaces without Firestore types.
- [ ] Remove Firebase/framework imports from domain.
- [ ] Update existing consumers.

Exit criteria:

- domain package runs tests independently;
- domain package has no Firebase, React, Expo, HTTP, or database dependencies.

### Phase 2 — Introduce application use cases

Goal: remove orchestration from screens.

Start with holdings:

- `AddHolding`
- `UpdateHolding`
- `DeleteHolding`
- `SubscribeToHoldings` or a query/subscription port
- `GetPortfolioSummary`

Tasks:

- [ ] Create `packages/application`.
- [ ] Define use-case inputs/outputs.
- [ ] Inject repository/gateway interfaces.
- [ ] Move non-UI orchestration from `HomeScreen`.
- [ ] Add unit tests with fake repositories.
- [ ] Keep use cases unaware of Firestore.

Exit criteria:

- holdings behavior can be tested without Firebase;
- screens no longer call Firestore repository functions directly.

### Phase 3 — Extract infrastructure adapters

Goal: isolate Firebase and external integrations.

Tasks:

- [ ] Create `packages/infrastructure`.
- [ ] Implement `FirestoreHoldingsRepository`.
- [ ] Move Firebase document mapping into infrastructure.
- [ ] Add Firebase/Auth gateway adapters as needed.
- [ ] Keep Firebase initialization/composition out of core packages.
- [ ] Add integration tests for adapters.
- [ ] Separate client-safe adapters from server-only adapters through package exports.

Exit criteria:

- replacing Firestore would not require changes to domain/application;
- infrastructure implements interfaces defined inward.

### Phase 4 — Move Expo into `apps/mobile`

Goal: establish the first true application boundary.

Tasks:

- [ ] Create `apps/mobile`.
- [ ] Move Expo config and mobile source.
- [ ] Move `App.tsx`.
- [ ] Move presentation components/screens.
- [ ] Add mobile composition root.
- [ ] Wire application use cases to infrastructure implementations.
- [ ] Update Expo/EAS paths and scripts.
- [ ] Verify Android, iOS, and web preview as applicable.
- [ ] Verify no server-only package enters the Expo bundle.

Exit criteria:

- `pnpm --filter @portfolio/mobile start` runs the app;
- mobile contains delivery concerns, not canonical business logic.

### Phase 5 — Add market-data backend boundary

Goal: introduce server-side responsibilities before provider work expands.

Tasks:

- [ ] Create `apps/market-data-worker`.
- [ ] Add server composition root.
- [ ] Define provider ports in application/domain as appropriate.
- [ ] Implement provider adapters in infrastructure.
- [ ] Keep credentials server-only.
- [ ] Implement ingestion use cases in application.
- [ ] Add provider contract tests.
- [ ] Add persistence adapters.
- [ ] Add operational logging and job-result models.

Exit criteria:

- provider SDK and credentials cannot be imported by mobile/web;
- ingestion logic is testable independently from scheduler/provider implementation.

### Phase 6 — Add API application when required

Goal: provide secure server operations and shared backend access.

Create `apps/api` only when a use case needs an HTTP boundary.

Tasks:

- [ ] Select server framework/runtime.
- [ ] Add authentication middleware at the app boundary.
- [ ] Map HTTP requests to application use cases.
- [ ] Keep controllers thin.
- [ ] Reuse domain/application packages.
- [ ] Add integration/contract tests.

Exit criteria:

- API controllers contain transport mapping, not business rules.

### Phase 7 — Add web application when required

Goal: add web without duplicating business behavior.

Tasks:

- [ ] Create `apps/web`.
- [ ] Reuse domain/application/contracts.
- [ ] Add web-specific presentation and composition.
- [ ] Consume API/use cases according to deployment model.
- [ ] Do not share mobile UI components unless explicitly platform-neutral.

Exit criteria:

- mobile and web share rules/use cases, not delivery components.

## 5. Dependency contracts

### Domain repository contract example

```ts
export interface HoldingsRepository {
  add(userId: string, holding: HoldingInput): Promise<PortfolioHolding>;
  update(
    userId: string,
    holdingId: string,
    holding: HoldingInput,
  ): Promise<PortfolioHolding>;
  delete(userId: string, holdingId: string): Promise<void>;
  list(userId: string): Promise<PortfolioHolding[]>;
}
```

This contract must not expose:

- Firestore;
- document snapshots;
- collection references;
- provider SDK types.

### Application use case example

```ts
export class AddHolding {
  constructor(
    private readonly holdings: HoldingsRepository,
  ) {}

  execute(input: AddHoldingInput) {
    return this.holdings.add(input.userId, input.holding);
  }
}
```

### Infrastructure adapter example

```ts
export class FirestoreHoldingsRepository
  implements HoldingsRepository {
  // Firebase implementation only
}
```

### Composition example

```ts
const repository = new FirestoreHoldingsRepository(db);
const addHolding = new AddHolding(repository);
```

Only the composition root constructs concrete dependencies.

## 6. Rules for deciding where code belongs

Ask these questions in order.

### Does it express a business rule?

Put it in `domain`.

Examples:

- portfolio value calculation;
- ticker/exchange identity;
- overlap calculation;
- freshness classification if business-defined;
- alert threshold rule.

### Does it coordinate a user/system action?

Put it in `application`.

Examples:

- add holding;
- evaluate alerts;
- ingest a quote batch;
- search instruments;
- calculate and persist an analysis snapshot.

### Does it talk to technology?

Put it in `infrastructure`.

Examples:

- Firestore;
- Firebase Auth;
- provider APIs;
- push notification service;
- logging platform.

### Does it render or receive requests?

Put it in an `app`.

Examples:

- React Native screen;
- Next.js route/page;
- Express/Fastify controller;
- scheduled process startup.

## 7. Client/server split

Not every infrastructure adapter is safe for every runtime.

Use explicit exports:

```text
@portfolio/infrastructure/client
@portfolio/infrastructure/server
```

Client-safe examples:

- Firebase Auth client adapter;
- Firestore read/user-data adapter if policy permits.

Server-only examples:

- Admin SDK;
- provider credentials;
- privileged Firestore writer;
- scheduler;
- ingestion adapters.

CI should fail if a client app imports a server-only entry point.

## 8. Testing strategy by layer

### Domain

Fast pure unit tests.

No Firebase/emulators.

### Application

Use-case tests using fakes.

No external network.

### Infrastructure

Adapter integration tests.

Examples:

- Firestore emulator;
- provider sandbox/fixtures;
- HTTP client mapping.

### Apps

Delivery tests.

Examples:

- React Native component/UI tests;
- API endpoint tests;
- end-to-end flows.

### Cross-system

Reserve full E2E tests for critical user flows.

Do not use E2E coverage as a substitute for domain/application unit tests.

## 9. Migration constraints

During migration:

- no feature freeze is required;
- do not duplicate a module in old and new locations;
- move tests with behavior;
- keep each migration PR small;
- preserve working builds after every step;
- do not create abstractions without a real boundary;
- do not create one package per class or feature;
- packages represent architectural ownership, not arbitrary code grouping.

## 10. Suggested first migration PRs

### PR 1 — Workspace foundation

- add workspace config;
- add base TypeScript config;
- create `packages/domain`;
- leave Expo app otherwise unchanged.

### PR 2 — Portfolio domain extraction

- move portfolio types;
- move portfolio calculations;
- update tests/imports.

### PR 3 — Holdings application layer

- add holdings repository interface;
- add holdings use cases;
- add fake repository tests.

### PR 4 — Firestore adapter

- move holdings Firestore implementation to infrastructure;
- update app composition.

### PR 5 — Mobile app boundary

- move Expo source/config into `apps/mobile`;
- add mobile composition root;
- update CI/EAS scripts.

After PR 5, new MVP features should be implemented directly in the target architecture.

## 11. Definition of architecture migration complete

The migration is complete when:

- [ ] mobile runs from `apps/mobile`;
- [ ] server jobs run from server apps;
- [ ] web/API apps, when present, have independent entry points;
- [ ] domain contains no framework/infrastructure dependencies;
- [ ] application use cases depend only on inward contracts;
- [ ] infrastructure implements inward interfaces;
- [ ] apps select concrete implementations in composition roots;
- [ ] client builds cannot import server-only modules;
- [ ] architecture dependency rules run in CI;
- [ ] existing MVP behavior and tests still pass;
- [ ] architecture documentation reflects the implementation.

## 12. Relationship to MVP issues

The architecture migration should not become a separate multi-month rewrite.

Recommended alignment:

- complete workspace/domain/application extraction before substantial work on #14–#16;
- build #14 domain contracts directly in `packages/domain`/`packages/contracts`;
- build #15 ingestion through `apps/market-data-worker`, `packages/application`, and server infrastructure;
- build #16 Firestore persistence/security without exposing infrastructure details to domain/application;
- implement #17–#23 using the established package boundaries;
- include architecture-boundary verification in #24.

