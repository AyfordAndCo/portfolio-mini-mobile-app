# Stock and ETF Analysis

Design documents for adding analysis of individual company shares and exchange-traded funds (ETFs) to the Portfolio Mini Mobile App.

## Documents

1. [Product and process plan](product-and-process-plan.md)
2. [Analysis algorithm](analysis-algorithm.md)
3. [System architecture](system-architecture.md)
4. [Database design](database-design.md)
5. [UML models](uml.md)
6. [Wireframes and UI/UX system](wireframes-and-ui-ux.md)
7. [Implementation plan (SA-PLAN-01)](implementation-plan.md)
8. [Folder structure plan (SA-FS-01)](folder-structure-plan.md)

## Status

The first release is scoped to JSE-listed ordinary shares and ETFs, including JSE-listed funds with international underlying exposure. Direct US-listed securities and broader global exchange coverage are deferred to [backlog issue #12](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/12). Provider selection, data display rights, latency/update cadence, analysis objectives, navigation library, and any score weights remain decision gates. The app does not make automatic trades.

## Repository context

The canonical repository is `AyfordAndCo/portfolio-mini-mobile-app`, whose default branch is `develop`. The existing app uses Expo/React Native, TypeScript, Firebase Authentication, and Firestore. Existing user holdings are stored below `users/{userId}/holdings`.

This documentation set is maintained in `docs/stock-analysis/`. The implementation plan is SA-PLAN-01 and the proposed feature-oriented folder structure is SA-FS-01.
