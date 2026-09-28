# Stock and ETF Analysis

Design documents for adding analysis of individual company shares and exchange-traded funds (ETFs) to the Portfolio Mini Mobile App.

## Documents

1. [Product and process plan](product-and-process-plan.md)
2. [Analysis algorithm](analysis-algorithm.md)
3. [System architecture](system-architecture.md)
4. [Database design](database-design.md)
5. [UML models](uml.md)
6. [Wireframes and UI/UX system](wireframes-and-ui-ux.md)
7. [Implementation plan](implementation-plan.md)

## Status

Draft for review. The provider, supported exchanges, data latency, analysis objectives, and any score weights remain decision gates. This design supports both individual shares and ETFs and does not assume automatic trading.

## Repository context

The target repository is `allanayford-dev/portfolio-mini-mobile-app`, whose default branch is `develop`. The existing app uses Expo/React Native, TypeScript, Firebase Authentication, and Firestore. Existing user holdings are stored below `users/{userId}/holdings`.

These documents were prepared for `docs/stock-analysis/`. They have not been committed because the connected GitHub integration denied branch and contents writes with HTTP 403.
