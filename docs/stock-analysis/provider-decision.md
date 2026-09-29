# JSE Market-Data Provider Decision

**Issue:** [#13](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/13) — [M0] Select JSE market-data provider, licensing, and refresh policy
**Status:** Draft — recommendation recorded; **pending written vendor confirmation**
**Date:** 2026-09-29
**Related:** [implementation-plan.md](implementation-plan.md) (M0), [system-architecture.md](system-architecture.md), [database-design.md](database-design.md), [analysis-algorithm.md](analysis-algorithm.md)

## 1. Purpose

This is the M0 decision record for issue #13. It selects the licensed market-data source, quote latency class, and refresh policy for the first release, and records the rejected alternatives with the reason each was rejected.

Issue #13 is the gate for M1/M2 implementation ([implementation-plan.md](implementation-plan.md), M0). Two downstream issues depend on its outputs directly:

- [#15](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/15) needs the cadence, quota budget, JSE session behaviour, and stale-state calculation.
- [#20](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/20) needs the freshness states and stale thresholds verbatim ("#13 provider policy").

## 2. Scope and constraints

In scope for the first release:

- JSE-listed ordinary shares.
- JSE-listed ETFs and ETNs, including funds with international underlying exposure.
- Reference data, quotes, historical bars, distributions/corporate actions, and — where obtainable — fundamentals and ETF constituent holdings.

Explicitly out of scope (deferred to [#12](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/12)): direct US-listed securities and broader global exchange coverage.

**Currency scope — JSE-first does not mean ZAR-only.** The JSE lists instruments denominated in currencies other than the rand, notably USD-denominated exchange-traded notes (see the [JSE market notice on FirstRand ETN listings](https://clientportal.jse.co.za/Content/JSENoticesandCircularsItems/JSE%20Market%20Notice%2009025%20EQM%20-%20FirstRand%20ETN%20Listings%20-%2024%20March%202025.pdf) and the [Investec USD ETN brochure](https://www.investec.com/content/dam/south-africa/intermediaries/invest/equity-products/exchange-traded-notes/iblusd/Investec-USD-ETN-Brochure-IBLUSD.pdf)).

Two consequences:

- The `currency` field in [#14](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/14) is load-bearing, not decorative, and must be carried per instrument rather than assumed from the exchange.
- The current client formatter hardcodes a `R ` prefix and `en-US` grouping ([utils/formatCurrency.ts](../../utils/formatCurrency.ts)), so it cannot represent a USD-quoted JSE instrument correctly. This conflicts with the design rule to "format money using the asset's currency and the portfolio's display currency separately" ([wireframes-and-ui-ux.md](wireframes-and-ui-ux.md) §3).

The first release must either explicitly exclude non-ZAR instruments or format per instrument currency. Whichever is chosen is recorded in §7, and the choice feeds [#14](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/14) and [#20](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/20).

Binding constraints from existing documentation:

| Constraint | Source |
|---|---|
| The app is a research aid; it does not execute trades or promise returns. | [product-and-process-plan.md](product-and-process-plan.md) §1, §3 |
| Never label a price "live" unless the provider contract and returned metadata support that label. | [product-and-process-plan.md](product-and-process-plan.md) §6 |
| Never interpret missing data as zero. | [product-and-process-plan.md](product-and-process-plan.md) §6 |
| Provider credentials and privileged Firestore writes must remain server-side. | [system-architecture.md](system-architecture.md) §2, [overview.md](../architecture/overview.md) §3 |
| Instrument identity includes exchange and currency, not ticker alone. | [product-and-process-plan.md](product-and-process-plan.md) §3 |
| Client security rules must deny writes to shared market data. | [database-design.md](database-design.md) §4, [#16](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/16) |

## 3. Evaluation criteria

Derived from the development slices and acceptance criteria of issue #13. Each candidate is scored against:

1. JSE ordinary-share coverage and JSE ETF coverage.
2. Quote latency class: real-time, delayed, end-of-day, or none.
3. Historical bar availability and depth.
4. Fundamentals for JSE issuers.
5. Distributions and corporate actions.
6. ETF constituent holdings / look-through.
7. SENS or other announcement feed.
8. Display and redistribution rights for a mobile app shown to end users.
9. Cost, including any minimum commitment.
10. Rate limits and quotas.
11. Integration effort and API shape (REST/WebSocket, auth model).
12. Vendor risk: single-provider dependency, contract lock-in, and continued JSE entitlement.

## 4. Candidate comparison

Evaluated against the gate sequence in §7.1. **[V]** = verified with source, **[•]** = unverified / needs vendor contact.

| Candidate | Gate 1 — Rights | Gate 2 — Provenance | Gate 3 — Coverage | Gate 4 — Accessibility | Outcome |
|---|---|---|---|---|---|
| **ProfileData** (Profile Group) | On-distribution to end users under the client's own brand is an **advertised, standard part of their model** ("white labelled research tools", "on-distribute the data to their users") [V]. Upstream JSE consent for real-time unconfirmed [•]. | Not stated [•] | All JSE, NSX, A2X and CTSE listed companies; **ETFs and ETNs explicitly maintained**; SENS feeds; FundsData full holdings [V] | API explicitly offered (API/CSV/XML); sales-contact only, no self-serve signup. Pricing model published (CUG size × modules × delivery), **no figures** [V] | **PROCEED — primary candidate** |
| **Twelve Data** | Terms define "Redistribution" and permit external display **only** if expressly authorised by a Redistribution Rights Add-on or separate written agreement [V]. **Non-US commercial display requires additional approval**, and the customer is left responsible for compliance. | Not established [•] | JSE covered as exchange `XJSE`, 09:00–17:00 SAST [V]. JSE **ETF** coverage unconfirmed [•] | **Not self-serve and no published price** — the add-on is a manual request entering a review queue [V]. The tier spanning 85 markets starts at **$1,099/month**; whether `XJSE` is reachable on the $149 tier is unverified [V/•] | **Secondary — weaker than it appears** |
| **JSE Limited** (direct) | Contract-only. Website terms: *"you may not develop or create any product that uses, is based on, or is developed in connection with any of the data… available on this site"* without express written permission [V]. | Exchange — authoritative | Equities including Specialist Securities/ETPs; **no separately-named ETF product** [V]. SENS via IDP (EOD) or Regulatory News Gateway (live) [V] | No self-serve API; JDA/LDA contracts; JSE describes customers as "market professionals and data distributors" [V] | **Rejected — gate 4** (wholesale/B2B). Watch the JSE/DataBP marketplace (below) |
| **Sharenet** | Published rates are explicitly **non-professional, single-user, page-limited** retail licences; no app redistribution right offered [V]. | **Fails.** Own disclaimer: *"Market Statistics are calculated by Sharenet and are therefore not the official JSE Market Statistics"* [V]. | Shares, warrants, indices, portfolios, unit trusts; **ETFs not named** [V] | Published prices R180–R1 435/month, **but no API** [V] | **Rejected — gates 1, 2, 3** |
| **IRESS** (ION) | No public terms [•] | Iress is a distributor; sub-redistribution needs Iress **and** JSE consent [•] | Real-time global feeds; SA fund coverage; **JSE ETFs not separately named** [•] | No self-serve portal; contact sales only; **no published pricing**; broker/wealth-firm oriented [V] | **Rejected — gate 4** (wrong segment) |
| **EODHD** | Redistribution prohibited on self-serve plans — *"prohibited from: … retransmitting, redistributing, displaying, or granting access to the Information"* [V]. Redistribution-capable tier **$2,499/month** list [V]. | **Fails.** Own footer: *"We are not using exchanges data feeds for the pricing data, we are using OTC, peer to peer trades and trading platforms over 100+ sources, we are aggregating our data feeds via VWAP method"* [V]. | JSE listed; ETF coverage unverified [•] | Self-serve, but the rights-bearing tier is $2,499/mo [V] | **Rejected — gates 1, 2** |
| **Alpha Vantage** | Personal, non-commercial only; commercial use expressly includes letting other parties access the data [V] | — | — | Self-serve | **Rejected — gate 1** |
| **Financial Modeling Prep** | No published redistribution terms; all plans labelled "Individual" [V] | Unverified [•] | Named non-US markets are UK and Canada; **JSE not found** [V] | Self-serve | **Rejected — gates 1, 3** |
| **Yahoo Finance / TradingView** | No commercial redistribution rights granted [V] | Neither is a JSE-authorised redistributor [V] | `.JO` suffix / `JSE:` prefix coverage [V] | Free | **Prototype only — rejected for production** |
| **Tiingo** | **Publishes redistribution pricing** — "Business / Display Redistribution $250/month startups, $500/month enterprise" [V]. Useful as a market-rate benchmark for what display rights cost. | Multi-source composite, not a direct exchange feed [V] | **No JSE, no African exchange** — US, China A-shares, mutual funds only [V] | Self-serve | **Rejected — gate 3** (coverage) |
| **Finnhub** | Prohibited without written approval; *"All plan listed on Finnhub website is strictly for personal use"* — every tier is labelled Personal Use, including the $3,500/mo top tier [V] | Unverified [•] | International data is Enterprise/partner-gated; non-US markets named are TSX, LSE, Euronext, Deutsche Börse — **JSE not named** [V] | Self-serve, but personal-use licence only | **Rejected — gates 1, 3** |
| **Marketstack** | Operative agreement could not be extracted; a "Commercial Use" feature flag is **not** a redistribution grant [•] | Resells — US data sourced from Tiingo; other markets from unnamed providers [V] | **JSE coverage unknown**; coverage claims are internally inconsistent ("2700+" vs "70" exchanges) [V] | Self-serve | **Rejected — gate 1 unverifiable** |
| **Polygon.io / Massive.com** | Redistribution requires a separate agreement; US-centric licensing [V] | Direct exchange feeds | **No JSE / no African exchange** [V] | Self-serve | **Rejected — gate 3** |
| **Databento** | Not offered for non-US display [•] | Direct exchange feeds | **No JSE** — US venues (CME/Nasdaq/OPRA-oriented) [V] | Self-serve | **Rejected — gate 3** |
| **Intrinio** | Not offered; "Enterprise Custom $1,250/mo+" [V] | Direct exchange feeds, US-scoped | **US only** — every feed labelled US [V]. Its "Global ETF Holdings" card contradicts itself with "Full US Coverage" [V] | Enterprise | **Rejected — gate 3** |
| **LSEG / Refinitiv** | Negotiation-only; per-use-case entitlements | Exchange-sourced | JSE within global coverage | **Enterprise — contact sales, no published pricing** [V] | **Rejected — gate 4** |
| **Bloomberg** (B-PIPE / Data License) | Bilateral contract with explicit display entitlements, negotiated per use case | Exchange-sourced | JSE within global coverage | **Enterprise — no published pricing** [V] | **Rejected — gate 4** |
| **FactSet** | Per-use-case entitlement | Exchange-sourced | JSE within global coverage | **Enterprise — no published pricing** [V] | **Rejected — gate 4** |

**JSE Data Marketplace (DataBP) — watch item, not a decision.** In Sept 2024 the JSE partnered with DataBP on a cloud marketplace intended as "the central hub for all of the JSE's data products", automating entitlements and billing, with a "virtual storefront that will facilitate online data purchases" [V/R]. Whether that storefront is live, and whether it will sell to a small non-Professional app, is unverified [•]. This is the highest-value question to put to the JSE, because it could change this decision.

## 5. Data-type coverage matrix

Explicit `unsupported`/unverified entries are required rather than blanks, because [#15](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/15) requires unavailable fields to be reported as unavailable.

| Data type | ProfileData | Twelve Data | JSE direct | Sharenet | EODHD |
|---|---|---|---|---|---|
| **Quotes** | EOD, intraday "as required", and 15-min delayed live prices [V] | JSE listed; latency class per JSE unverified [•] | Real-time via JSE data centre or International Access Point; delayed **defined as ≥15 minutes** [V] | Real-time on Premium; 15-min delayed on lower tiers [V] | End-of-day / aggregated [•] |
| **Historical bars** | "Time-series data for all listed securities… where applicable"; depth unverified [V/•] | Unverified [•] | Sold self-serve via CME DataMine for tick/Level-2; depth unverified [V/•] | Daily OHLCV **up to 5 years** via CSV; intraday downloads on Premium [V] | Unverified [•] |
| **Fundamentals** | Core strength — "comprehensive financial data", fully relational [V] | Unverified [•] | Not a JSE product (reference/corporate-events data only) [V] | "Detailed Fundamentals — full financial statements" on Premium [V] | Unverified [•] |
| **Distributions / corporate actions** | Dividends named for the fund side; corporate-actions module unverified [•] | Unverified [•] | End-of-day products include "corporate events" [V] | "Dividend declarations" on Premium [V]; corporate actions via SENS [•] | Unverified [•] |
| **ETF constituent look-through** | **Best available**: ETFs/ETNs explicitly maintained; FundsData "Full holdings"; Marriott tool exposes holdings by code [V] | Unverified [•] | **Not offered** [V] | Unit trusts only — **not JSE ETFs** [V] | Unverified [•] |
| **SENS / announcements** | "news and SENS feeds" named; operates SENS delivery infrastructure [V] | Unverified [•] | EOD via Information Dissemination Portal, live via Regulatory News Gateway; **no delayed feed — "contact a live data distributor"** [V] | Current SENS (7 days) even on free tier; historical SENS on Premium [V] | Unverified [•] |

**The scarcest data type is ETF constituent look-through.** Neither the JSE nor Sharenet publishes it. The verified fallbacks are the issuers themselves — Satrix publishes feeder-ETF holdings PDFs, and etfsa.co.za hosts fund factsheets [V] — but these are PDFs, not a machine-readable feed, and their terms for app storage and display are unverified [•]. Per [analysis-algorithm.md](analysis-algorithm.md) §5, an ETF without holdings data must still show market metrics and mark look-through unavailable or stale; that path is therefore viable for the first release.

**A second, more serious gap: JSE-listed ETF/ETN instrument coverage is unconfirmed for every aggregator.** The global providers that do carry ETF products (FMP "ETF & Mutual Fund Holdings", Marketstack "ETF Holding", Intrinio "Global ETF Holdings", Finnhub ETF profiles) are all US- or developed-market-scoped in their published coverage notes, and **not one aggregator confirmed JSE-listed ETF coverage — including Twelve Data, whose JSE ordinary-share coverage is verified**. [V/•]

The working assumption — explicitly an assumption, not a finding — is that SA-listed ETF/ETN coverage is absent or partial even where JSE ordinary shares are covered, because ETF instrument masters and SA fund holdings data typically come from separate fund-data vendors [•]. **Only ProfileData explicitly claims ETF and ETN coverage** [V]. If no aggregator can supply JSE-listed funds, that alone forces either an SA vendor or a direct JSE licence — which would make this coverage gap, not ordinary-share pricing, the real blocker. It must be verified per provider before implementation.

## 6. Licensing and redistribution position

This section is the evidence base for gate 1 and the reason #13 remains open pending written confirmation.

### 6.1 The JSE's own position

The JSE is a **wholesale licensor**, and its website terms are restrictive by default:

> "All data and information provided by the JSE… is proprietary to the JSE. You may not copy, reproduce, modify, reformat, download, store, distribute, publish or transmit any data and information, except for your personal use. For the avoidance of doubt, **you may not develop or create any product that uses, is based on, or is developed in connection with any of the data and information available on this site.** You are not permitted (except where you have been given **express written permission** by the JSE) to use the data and information for commercial gain."

Redistribution is therefore an **explicitly contracted entitlement**, not a default. It is governed by the JSE Data Agreement (JDA), Limited JSE Data Agreement (LDA), Authorised Client Policy, Delayed Data Policy and General Data Use Policy — all PDFs that could not be text-extracted during research [•]. A snippet from the Indices Data Agreement Product and Services Form shows the shape of the entitlement: the licensee is "entitled to **disseminate the Intraday Data via any Customer Products**… in accordance with the relevant [agreement]".

Two further JSE facts shape the decision:

- **"Delayed" has a contractual definition**: *"Data must be delayed by at least 15 minutes to be classified as delayed."*
- **The JSE does not itself supply a delayed feed**: *"The JSE does not provide a direct feed for delayed market data. If you want to access delayed market announcement data for internal use or re-distribution, please contact a live data distributor."*

The practical consequence: **a small app must license through a JSE-authorised redistributor, not from the JSE.** JSE market-data fee figures, per-user/display fees, and minimum commitments are not publicly available [•].

### 6.2 Per-candidate display position

| Candidate | May it be displayed to app end users? | Evidence |
|---|---|---|
| **ProfileData** | **Yes in principle** — on-distribution to their users under the client's own brand is advertised as standard. Needs written confirmation that this covers a third-party mobile app and that ProfileData holds the upstream JSE right for the chosen latency class. | [V] + [•] |
| **Twelve Data** | **Only with authorisation** — permitted "only if and as expressly authorized by a Redistribution Rights Add-on or separate written agreement", with attribution requirements. | [V] |
| **JSE direct** | Only under a negotiated JDA/LDA with express written permission. | [V] |
| **Sharenet** | **No** — retail non-professional licence, single user, page-limited. | [V] |
| **IRESS** | Unknown; would require Iress **and** JSE consent. | [•] |
| **EODHD** | **No** on ordinary plans; permitted only on the $2,499/month tier. | [V] |
| **Alpha Vantage** | **No** — personal, non-commercial only. | [V] |
| **Yahoo / TradingView** | **No** — no redistribution rights granted. | [V] |

### 6.3 Attribution, storage, and derived data

Real-time versus delayed redistribution, storage duration limits, derived-calculation rights, and attribution wording are defined in documents that could not be extracted during research [•]. These must be answered by the vendor in writing, since they determine both the UI (source labelling, per [#20](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/20)) and the retention policy (§13).

## 7. Decision

**Verdict:** **ProfileData (Profile Group)** is the recommended provider — **conditionally**, pending written confirmation of two things (§18).

**No candidate satisfies gate 1 at a published price.** Twelve Data and ProfileData are the only candidates with any documented route to displaying data to end users; every other candidate either prohibits it outright or prices it at institutional levels. Of those two, ProfileData is recommended:

- It is the **only candidate that explicitly maintains ETFs and ETNs** — decisive, since JSE-listed funds are in scope.
- On-distribution to end users under the client's own brand is an **advertised, standard part of its commercial model**, not a special concession.
- It offers an **API** and prices on a published **volume/module (CUG) model** rather than enterprise-only.
- It is the strongest available route to **ETF and fund look-through**, the scarcest required data type (§5).

**Twelve Data** is the fallback, but weaker than it first appeared. It has a *named* Redistribution Rights Add-on and confirmed JSE pricing (`XJSE`), but the add-on is **not self-serve and has no published price** — it is a manual request that enters a review queue — and **non-US commercial display requires additional approval**. Twelve Data's own documentation shows the risk: for ASX, market data is "restricted to internal use, regardless of your subscription tier", with display requiring a licence obtained **directly from the exchange**. That is the template for how a non-US exchange can gate display, and it means **a direct JSE licence may be an additional required layer regardless of which aggregator is chosen**. Twelve Data's JSE ETF coverage is also unconfirmed, and the tier spanning 85 markets starts at $1,099/month.

Twelve Data therefore remains the fallback only if ProfileData fails *and* the JSE confirms no separate display licence is required.

**This recommendation is conditional, not settled.** Two evidence gaps mean the honest statement is "recommended, subject to vendor confirmation" rather than "selected":

1. ProfileData's right to on-license JSE data for third-party mobile display is unverified — upstream JSE consent governs it (§6.1).
2. ProfileData's data provenance (gate 2) is unstated, so it is not yet established that prices would be exchange-sourced.

If those confirmations fail, the fallbacks in §7.2 apply, with Twelve Data as the next candidate rather than an immediate fall-through to "no licensed data".

### 7.1 Decision logic

The criteria in §3 are not commensurable: a cheap provider with broad coverage is worthless if it forbids display to end users, and an expensive one with redistribution rights may still lack JSE ETF coverage. Candidates are therefore eliminated in gate order, and only survivors are compared on cost and effort.

| Gate | Requirement | Nature |
|---|---|---|
| **1. Rights** | End-user display of the data in a mobile app is permitted, either at a published price or via a documented agreement path. | Pass/fail. Eliminates regardless of every other merit. |
| **2. Provenance** | Prices are exchange-sourced. Providers aggregating OTC, peer-to-peer, or platform data are disqualified from being *the* price of record, or must be labelled as non-exchange-derived. | Pass/fail for the price of record. |
| **3. Coverage** | Covers JSE ordinary shares **and** JSE-listed ETFs/ETNs, with quotes and at least one historical bar series. | Pass/fail |
| **4. Accessibility** | Obtainable by a single developer: self-serve signup or a documented commercial contact; no institutional minimum commitment that a solo project cannot meet. | Pass/fail |
| **5. Trade-off** | Among survivors: latency class, quota, cost, integration effort, capability breadth (fundamentals, distributions, ETF holdings, announcements), and vendor risk. | Scored |

Gate order matters for the recommendation: it means the chosen provider is the best of those that are *legally and practically obtainable*, which is a defensible position, rather than the cheapest or the most feature-rich overall.

### 7.2 Fallback if gate 1 eliminates every candidate

This outcome is plausible — the early evidence is that several vendors forbid end-user display. The response, in order of preference:

1. **Narrow what is displayed** to the subset for which rights are held (for example, showing derived analysis and end-of-day values rather than a live quote), keeping the rest of the product intact.
2. **Pursue a written redistribution agreement** with a South African rights holder, accepting a longer lead time in exchange for a compliant path.
3. **Ship the feature without licensed market data**, using user-entered prices as the app does today, and defer provider-backed display.
4. **Document the block and keep the issue open.** Issue #13's own acceptance criteria permit this: the record must "name the provider or document why provider selection is blocked."

Option 4 is a legitimate outcome, not a failure. It is recorded here so that an unfavourable rights position produces a decision rather than an indefinite stall.

### 7.3 Latency class decision

**Decision: 15-minute delayed, with end-of-day for non-quote data. Real-time is explicitly deferred.**

Rationale:

- The JSE contractually defines delayed as **at least 15 minutes**, making it a distinct entitlement from real-time — and distinct entitlements are priced differently [V].
- The product is a research aid that does not execute trades ([product-and-process-plan.md](product-and-process-plan.md) §1). Real-time latency buys nothing for that use case while adding licensing cost and risk.
- ProfileData already offers **15-minute delayed live prices** alongside end-of-day data [V], so the recommended provider supports this class directly.
- It keeps the app consistent with the existing product rule: never label a price "live" unless the provider contract and returned metadata support it. Under this decision the app declares `DELAYED` or `END_OF_DAY`, never `LIVE`.

Consequence for §9.1, with `refreshCadence` = 5 minutes, `displayDelay` = 15 minutes and `ingestionGrace` = 2 minutes:

```text
staleThreshold = max(2 x 5, 15 + 2) = max(10, 17) = 17 minutes
```

So a quote is stale 17 minutes after its provider timestamp. For end-of-day data types (fundamentals, distributions, bars) the threshold is expressed against the expected publication cadence rather than minutes — daily data becomes stale after the next session close plus grace.

### 7.4 Rejected alternatives

| Rejected | Gate failed | Reason (evidence) |
|---|---|---|
| **JSE Limited (direct)** | 4 — Accessibility | No self-serve API; contract-only (JDA/LDA); wholesale/B2B orientation; fees not published. *Not a rights rejection* — the JSE is the authoritative source, and a redistributor is the practical route to it. |
| **Sharenet** | 1, 2, 3 | Non-professional single-user retail licence with no redistribution right; own disclaimer states its statistics are **not** official JSE statistics; ETFs not named; no API. |
| **IRESS** | 4 — Accessibility | No self-serve portal, no published pricing, broker/wealth-firm oriented; a small app is far below its target segment. |
| **EODHD** | 1, 2 | Prohibits redistribution below the $2,499/month tier, and aggregates OTC/peer-to-peer/platform sources via VWAP rather than using exchange feeds — so its prices are not the price of record. |
| **Alpha Vantage** | 1 — Rights | Personal, non-commercial only; its definition of commercial expressly captures providing data to other parties. |
| **Yahoo Finance / TradingView** | 1 — Rights | No commercial redistribution rights; not JSE-authorised redistributors. Acceptable for throwaway prototypes only, never for a shipped build. |
| **Moneyweb** | 3 — Coverage | Free SENS archive only; no market-data product, no API, redistribution rights unknown. |
| **Ince, Intellidex, 4AX** | 3 — Coverage | No verifiable app-relevant data product on public evidence: Ince is legacy B2B connectivity, Intellidex is a research house, 4AX is a different exchange. |
| **Financial Modeling Prep** | 1, 3 | All plans labelled "Individual"; named non-US markets are UK and Canada; **JSE not found**. |
| **Tiingo** | 3 — Coverage | **No JSE, no African exchange.** Worth noting separately: Tiingo *publishes* display-redistribution pricing ($250/month startup, $500/month enterprise), which is the only public benchmark found for what display rights cost. |
| **Finnhub** | 1, 3 | Every tier labelled "Personal Use", including the $3,500/month tier; international data is partner-gated and the JSE is not among the named markets. |
| **Marketstack** | 1 — unverifiable | Operative agreement could not be extracted; a "Commercial Use" feature flag is not a redistribution grant; JSE coverage unstated and coverage claims are self-contradictory. |
| **Polygon.io (Massive.com), Databento, Intrinio** | 3 — Coverage | No JSE / no African exchange; US-venue-centric. Intrinio is explicitly US-only with an Enterprise entry at $1,250/month. |
| **LSEG/Refinitiv, Bloomberg, FactSet** | 4 — Accessibility | All cover the JSE within global coverage, all are negotiation-only with no published pricing and per-use-case display entitlements. Enterprise gate. |
| **Watch item (not rejected)** | — | The **JSE/DataBP marketplace** could make JSE data directly purchasable and would materially change this decision. Worth re-checking at each renewal. |

**Watch item (not rejected):** the **JSE/DataBP marketplace** could make JSE data directly purchasable and would materially change this decision. Worth re-checking at each renewal.

## 8. Refresh cadence and JSE session policy

### 8.1 Session window

- **Continuous trading: 09:00–17:00 SAST** (JSE equities, as published for exchange `XJSE`) [V].
- **South Africa does not observe daylight saving**: SAST is UTC+02:00 year-round [V]. This matters twice over — session boundaries stay fixed against wall-clock time, and staleness arithmetic needs no DST handling, which is also why Cloud Scheduler's wall-clock/DST caveat is a non-issue here.
- **Exact pre-open, opening-auction and closing-auction times are not yet verified** [•]. This does not block implementation — polling outside continuous trading returns an unchanged or absent quote and is harmless — but it should be confirmed before finalising the schedule, since polling during an auction may return indicative rather than traded prices.

### 8.2 Schedule

| Job | Cron (`Africa/Johannesburg`) | Purpose |
|---|---|---|
| Quote poll | `*/5 9-17 * * 1-5` | Poll the provider every 5 minutes during the session and write one latest-quote document per instrument |
| End-of-day snapshot | `30 17 * * 1-5` | Persist the session close and refresh daily bars |
| Lower-frequency refresh | `0 6 * * 2-6` | Fundamentals, distributions, ETF holdings — outside market hours to avoid contention |

**Non-trading days.** Cron cannot express JSE public holidays, so the job will fire on holidays. The worker must therefore detect a non-trading day (via provider market status or a JSE trading calendar) and exit cheaply without writing or overwriting data, so a holiday does not age every quote into the stale state through a spurious failed poll. This is a requirement on [#15](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/15).

**Verification caveat.** `Africa/Johannesburg` is a valid tz-database identifier, but Google does not enumerate supported zones and the worker region `africa-south1` was not verified as a *Firebase* functions region [•]. Both must be confirmed in the console during M2.

### 8.3 Cadence per data type

| Data type | Cadence | Freshness expectation |
|---|---|---|
| Quotes | 5 minutes during session | Stale after 17 minutes (§7.3) |
| Daily bars | Once post-close | Stale after the next session close + grace |
| Fundamentals, distributions | Daily / event-driven | Stale against expected publication cadence |
| ETF holdings | Issuer publication cadence (weekly–monthly) | Marked stale when older than the policy window; look-through degrades first ([analysis-algorithm.md](analysis-algorithm.md) §5) |

## 9. Freshness states and staleness thresholds

This section is the contract that [#20](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/20) consumes.

Every market-derived value carries:

- `marketStatus`: `LIVE` | `DELAYED` | `END_OF_DAY` | `UNKNOWN`
- `qualityStatus`: one of the five values defined in [analysis-algorithm.md](analysis-algorithm.md) §7.

Two distinct timestamps are shown, never conflated:

- **provider/exchange timestamp** — when the market data was true.
- **retrieval timestamp** — when the worker received it.

Staleness is measured from the provider timestamp, evaluated per data type, and compared against a threshold that accounts for the display delay class. Threshold values are set in §8 once the latency class is fixed; the state set and the rules below are independent of that choice:

| State | Condition | UI obligation |
|---|---|---|
| Fresh | Within the per-type threshold for the chosen latency class | Show value with source and as-of time |
| Stale | Older than threshold but a last-known-good value exists | Show last-known-good value with a stale badge; never present as live |
| Offline | Client cannot reach Firestore or the worker is paused | Show cached value plus last successful sync time |
| Unavailable | No valid value has ever been stored, or the field is unsupported by the provider | Show an explicit unavailable state; never render as `0` |
| Delayed / end-of-day | Provider metadata declares the delay class | Label the delay class alongside the value |

Threshold and boundary behaviour must be unit-tested at the exact boundaries ([#20](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/20) slices "tests for threshold boundaries" and "stale prices are never visually presented as live/current").

### 9.1 Threshold derivation rule

Thresholds are not arbitrary constants. For each data type, the stale threshold is derived as:

```text
staleThreshold = max(2 x refreshCadence, displayDelay + ingestionGrace)
```

where `refreshCadence` is the polling interval for that data type (§8), `displayDelay` is the provider's contractual delay class (0 for real-time, 15 minutes for typical delayed feeds, or the session close for end-of-day), and `ingestionGrace` is a small allowance for worker execution and retry. This keeps the threshold meaningful across latency classes: a delayed feed is not flagged stale simply for being delayed, and a real-time feed is flagged promptly.

The concrete numbers are recorded in §8 once the latency class is fixed. The formula is fixed now so that [#20](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/20) can implement and test boundary behaviour without waiting for the provider decision to be finalised.

### 9.2 Feed-failure policy

Required by the #13 acceptance criterion "define what the app shows when feeds fail" and by the reliability rules in [system-architecture.md](system-architecture.md) §5 and [#15](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/15):

- **Never overwrite good data with null or zero.** A failed fetch leaves the last known-good value and its original timestamps in place ([system-architecture.md](system-architecture.md) §5; [product-and-process-plan.md](product-and-process-plan.md) §6).
- **Track last success and last attempt separately, per provider and per data type.** Staleness is computed from the last *successful* provider timestamp, not from the last attempt, so a retry loop cannot mask an outage.
- **Classify failures** as auth/permission, quota or rate limit, provider server error, malformed response, or timeout, and record the class on the sync-run record. Auth and quota failures surface as operational problems, not silent staleness.
- **Bound the retries.** Timeouts and bounded backoff per [system-architecture.md](system-architecture.md) §5, so a provider outage cannot consume the polling window or exhaust quota.
- **Pause switch.** An ingestion pause ([#15](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/15)) stops scheduled fetches without deleting stored data. While paused, all values age into the stale state by the normal rule rather than being relabelled, so the UI tells the truth during a maintenance window.
- **Surface the failure.** The app shows provider status and last successful sync ([implementation-plan.md](implementation-plan.md) §5), which means the freshness state and the sync-health record must be readable by the client — a dependency for [#16](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/16) when it defines read access to sync-run records.

## 10. Quota budget and rate-limit strategy

**No candidate publishes a JSE rate limit.** ProfileData publishes none [V]; the JSE documents none [V]. Twelve Data's self-serve tiers are credit-based (Free/Basic: 800 calls/day) [V], which is far below this workload.

### 10.1 Demand

```text
instruments          = ~500 (JSE ordinary shares + ETFs/ETNs)
polls per session    = 102  (5-minute cadence across 09:00-17:00)
provider calls/day   = 500 x 102 = 51,000
```

**51,000 calls/day is not obtainable on any self-serve tier and is itself a gating constraint.** The design response is not to request a bigger quota but to reduce the call count:

- **Use a bulk/multi-symbol quote endpoint**, so one call returns many instruments. Where the provider supports it, the cycle drops from ~500 calls per poll to ~1, which changes the demand from 51,000 calls/day to roughly 102 — three orders of magnitude, and the difference between an ordinary tier and an enterprise one.
- **Fetch only on trading days and within the session**, per §8.

Bulk capability must therefore be treated as a **selection criterion**, not an optimisation. It is added to the gate-3 coverage questions for M2.

### 10.2 Quota-exhaustion strategy

Quota exhaustion is worse than a stale quote: it can suspend the licence and breach the contract, whereas stale data is merely degraded.

- Classify 429/quota/auth responses distinctly from transient failures, and record the class on the sync-run record (§9.2).
- On quota exhaustion, **stop the poll cycle for the session** rather than retrying — bounded backoff with jitter, never a tight retry loop.
- Track cumulative daily call count against the contracted allowance and refuse to start a poll that would exceed it.
- Surface quota pressure operationally before it becomes an outage ([implementation-plan.md](implementation-plan.md) §5).

## 11. Cost model

All infrastructure figures are published Google/Firebase list prices verified 2026-09-29; the provider licence is **not priced by anyone** and is marked as such.

### 11.1 Infrastructure (verified, published prices)

Assumptions: 500 instruments, one latest-quote document per instrument (document ID = instrument ID, so the collection is overwritten and never grows), 102 polls/day, 21 trading days/month.

```text
writes/month    = 500 x 102 x 21            = 1,071,000
free allowance  = 21 x 20,000               =   420,000
billable        =                              651,000
write cost      = 651,000 / 100,000 x $0.09 =    $0.59
```

| Component | Monthly cost | Basis |
|---|---|---|
| Firestore writes (5-min poll) | **$0.59** | Above |
| Firestore writes (1-min poll) | $4.44 | 5,355,000 writes, sensitivity case |
| Firestore writes (15-min poll) | **$0.00** | Under the free allowance |
| Firestore reads | $0.00–$0.90 | 300 DAU → free tier; 1,000 DAU → $0.90 |
| Firestore storage | $0.00 | Few hundred KiB against a 1 GiB free tier |
| Cloud Scheduler | $0.00 | 1 job within the 3-free-jobs-per-billing-account tier |
| Secret Manager | $0.00 | 1 active version, ~1 access per cold start; within free allowances |
| Cloud Functions | $0.00 | Within the 2M-invocation / 400K GB-s free tier |
| Static egress IP (only if the provider requires allow-listing) | ~$4–5 | Cloud NAT gateway + one static address — **more than the rest of the stack combined** |

**Infrastructure total: under ~$1.50/month at a 5-minute cadence**, or roughly $5.50 if a static egress IP is mandated.

### 11.2 Provider licence (unpriced — the real cost)

| Benchmark | Figure | Note |
|---|---|---|
| Tiingo display-redistribution | **$250/month** (startup), $500/month (enterprise) | Published, but **no JSE coverage** — useful only as a market-rate reference |
| EODHD redistribution-capable tier | **$2,499/month** | Includes a data services agreement; its cheaper $399 tier explicitly excludes one |
| Twelve Data Enterprise | **from $1,099/month** | Plus an unpriced, approval-gated redistribution add-on |
| ProfileData | **No published figure** | CUG size × modules × delivery mechanism; must be quoted |

**The decision-relevant comparison is between these two tables.** Infrastructure is roughly **$1/month**; a display licence plausibly costs **$250–$2,500/month** — a difference of two to three orders of magnitude. The provider licence *is* the cost of this feature, and it is the one number nobody publishes. This is the single strongest argument for resolving §18 before any implementation work begins.

## 12. Hosting, scheduler, secrets, and quota constraints

### 12.1 Recommended shape

**A Cloud Scheduler job (5-minute cron, `Africa/Johannesburg`, restricted to JSE hours) invoking a 2nd-generation scheduled Cloud Function that reads the provider key from Secret Manager and writes one latest-quote document per instrument using a bulk writer.**

| Element | Decision | Why |
|---|---|---|
| Scheduler | Cloud Scheduler → scheduled function | 1 job sits inside the 3-free-jobs-per-billing-account tier; cron granularity is 1 minute |
| Compute | 2nd-gen scheduled Cloud Function | Scheduled functions are capped at **1800 s** — about two orders of magnitude more than a 500-instrument poll needs. Scales to zero, which is correct since no user traffic hits the worker |
| Region | `africa-south1` (Johannesburg), Tier 1 | Sits near both Firestore and the JSE. **Not verified as a Firebase functions region** [•] |
| Secrets | Secret Manager, bound to the worker function only | Firebase's own guidance: `.env` is not a secure store for API keys. `functions.config()` is deprecated and **decommissions March 2027** |
| Writes | Bulk writer; document ID = instrument ID | Keeps the collection flat at ~500 documents with no growth (§13) |
| Retries | Set a retry policy explicitly | Cloud Scheduler's `retryCount` defaults to **0**, meaning *no retry at all* — the job silently waits for the next scheduled run |

### 12.2 Streaming is not available on this shape

**WebSockets are not possible on a scheduled function**: the invocation is bounded, and the functions networking guidance documents no outbound stream support. If a provider later offers a streaming feed, **that leg must move to a Cloud Run service**, where WebSockets need no extra configuration but must be raised to the 60-minute request timeout, with clients handling reconnects, HTTP/2 end-to-end kept off, and an instance holding an open socket billed continuously as instance-based.

This is consistent with the scope decision in [product-and-process-plan.md](product-and-process-plan.md) §3 to defer streaming until entitlements and need justify it — and §7.3 already selects delayed data, so no streaming leg is required for the first release.

### 12.3 Verified limits that constrain the design

| Limit | Value | Consequence |
|---|---|---|
| Firestore write rate, indexed sequential field | **500 writes/s per collection** | Our average is ~1 write/s; nowhere near. Exempt sequential timestamp fields from indexing anyway |
| Firestore single-document sustained write rate | **Not documented** — Google declines to give a figure | Do not design around a specific ceiling; the overwrite-one-doc-per-instrument pattern keeps each document's write rate to one per poll |
| Firestore document size | 1 MiB | Latest-quote documents are far smaller |
| Cloud Scheduler max HTTP job duration | 30 minutes | Would only matter if a poll exceeded 30 min — it will not |
| Cloud Functions max memory | 32 GiB | Not a constraint at this volume |

### 12.4 Verification caveats carried forward

- `Africa/Johannesburg` is a valid tz-database identifier, but Google does not enumerate supported zones [•] — confirm in the console.
- `africa-south1` was verified for Cloud Run Tier 1 pricing and appears in Firestore pricing, but **not** verified as a supported *Firebase* functions region [•].
- The claim that `EXPO_PUBLIC_*` must never hold the provider key rests on standard `EXPO_PUBLIC_` bundle-inlining semantics plus Firebase's verbatim "`.env` is not a secure store" guidance; the Expo documentation page itself was not fetched [•]. The conclusion is nonetheless unambiguous — anything in the shipped bundle is extractable.

**Repository layout dependency.** Where the worker lives is currently undecided and blocks M2 ([#15](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/15)) regardless of the hosting choice: [clean-architecture-migration.md](../architecture/clean-architecture-migration.md) places it at `apps/market-data-worker` as a workspace package, while [folder-structure-plan.md](folder-structure-plan.md) places it at `backend/market-data-worker/` inside the single package.

The runtime decision above is independent of that choice — the same scheduled job runs either way — but the deployment configuration path, package scripts, CI wiring, and secret-access boundary all differ. The two documents currently disagree, and the decision is not yet tracked in any issue. It must be recorded before M2 begins.

**Repository layout dependency.** Where the worker lives is currently undecided and blocks M2 ([#15](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/15)) regardless of the hosting choice: [clean-architecture-migration.md](../architecture/clean-architecture-migration.md) places it at `apps/market-data-worker` as a workspace package, while [folder-structure-plan.md](folder-structure-plan.md) places it at `backend/market-data-worker/` inside the single package.

The runtime decision below is independent of that choice — the same scheduled job runs either way — but the deployment configuration path, package scripts, CI wiring, and secret-access boundary all differ. The two documents currently disagree, and the decision is not yet tracked in any issue. It must be recorded before M2 begins.

## 13. Retention inputs for [#16](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/16)

Retention policy depends on the latency class and bar intervals now fixed in §7.3 and §8. The constraints that hold regardless:

- **Recommended pattern: persist one latest-quote document per instrument**, keyed by instrument ID and overwritten each poll, using a bulk writer. This keeps the collection flat at ~500 documents and never grows, which is why storage is free-tier and the write ceiling in §12.3 is never approached ([database-design.md](database-design.md) §5).
- Persist only the selected bar intervals in the first release.
- Exempt monotonically increasing timestamp fields from indexing to avoid the 500 writes/s indexed-sequential-field ceiling ([database-design.md](database-design.md) §5).
- Establish an explicit retention/archival period for raw provider responses and sync logs, because provider terms commonly restrict how long redistributable-derived data may be stored and how long raw responses may be retained.
- Quote-history growth is the dominant storage cost driver; the retention period must be recorded before production deployment, as flagged in [product-and-process-plan.md](product-and-process-plan.md) §7.

## 14. Capability-aware degradation

A single provider is unlikely to supply every data type for every instrument. Per [implementation-plan.md](implementation-plan.md) §6, each metric is capability-aware:

- Absent capability yields `unsupported` for that field, not a fabricated value.
- An ETF without obtainable holdings still shows market metrics and marks look-through as unavailable or stale ([analysis-algorithm.md](analysis-algorithm.md) §5).
- Capability gaps are recorded per provider and per instrument type so the UI can explain why a section is empty.

## 15. Consequences and risks

These hold regardless of which candidate is selected; §7 records which ones materialise for the chosen provider.

| Risk | Consequence | Response |
|---|---|---|
| **Rights are the binding constraint, not coverage.** Vendors readily expose JSE tickers but commonly licence data for personal or internal use only, prohibiting display to end users. | If no vendor sells end-user display rights at an accessible price, the JSE-first scope cannot ship as designed, regardless of technical readiness. | Establish the rights position before building ingestion (#15). If no accessible path exists, the fallback is to reduce what is displayed to end users or to defer display until a licensed redistribution path is agreed. |
| **Data provenance is not guaranteed to be exchange-sourced.** At least one candidate aggregates OTC, peer-to-peer and platform sources rather than using exchange feeds. | An aggregated "price" is not an official exchange price. This undermines the source attribution the UI is required to show ([Wireframes and UI/UX system](wireframes-and-ui-ux.md) §3, [#20](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/20)) and can differ materially from the traded price. | Prefer exchange-fed sources. Where aggregation is unavoidable, record the provenance method in the stored record's `source` field and never label it as an exchange price. |
| **Single-provider dependency.** | A vendor outage, price increase, or de-listing of the JSE feed stops all market data at once. | Keep the provider behind the adapter boundary defined in [system-architecture.md](system-architecture.md) §4; make every metric capability-aware so a missing field degrades rather than breaks. |
| **Entitlement continuity.** JSE or vendor redistribution terms can change at renewal. | Previously permitted display can become non-compliant with no code change. | Record the dated terms evidence in §6 and re-verify at each renewal. Treat the rights position as an operational control, not a one-time setup task. |
| **Latency versus cost.** Delayed or end-of-day data is materially cheaper than real-time. | The chosen latency class changes what the product can claim, and changes the freshness thresholds in §9.1 so that the same user-visible meaning is preserved. | The latency class is part of the decision in §7, not an implementation detail. The UI must never label delayed data as live ([product-and-process-plan.md](product-and-process-plan.md) §6). |
| **Instrument identity.** JSE-listed funds include non-ZAR instruments and ETNs that do not behave like ordinary shares. | Ticker-only or ZAR-only assumptions produce wrong pricing and wrong formatting. | Exchange-aware identity per [#14](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/14); per-instrument currency (see §2). |
| **Capability gaps are the norm, not the exception.** Few sources supply ETF look-through, fundamentals, and distributions for JSE instruments together. | Some sections of the product will be empty for some instruments in the first release. | Capability-aware degradation (§14): report `unsupported` explicitly rather than fabricating or zeroing values. |

_Per-provider risk materialisation recorded in §7._

## 16. Acceptance criteria mapping (issue #13)

| #13 acceptance criterion | Where satisfied | State |
|---|---|---|
| A decision record names the provider or documents why provider selection is blocked. | §7 — names **ProfileData** conditionally, records **Twelve Data** as fallback, and documents the fallback path if both fail (§7.2) | **Met** |
| Market coverage and data rights are confirmed **in writing** for the app's intended use. | §6 plus vendor correspondence held by the repository owner | **Outstanding — requires owner action; see §18** |
| The decision records latency, cadence, costs/quotas, history, and per-field availability. | Latency §7.3 · cadence §8 · quotas §10 · cost §11 · per-field availability §5 | **Met**, with vendor-confirmation gaps explicitly marked `[•]` |
| The plan defines when data is considered stale and what the app shows when feeds fail. | §9 (states), §9.1 (threshold derivation), §9.2 (feed-failure policy) | **Met** |

**Newly identified blocker, not in the original criteria:** JSE-listed **ETF/ETN instrument coverage is unconfirmed for every aggregator candidate** (§5). This is recorded in §18 because it may prove to be the real blocker rather than ordinary-share pricing.

## 17. Downstream issue alignment

| Issue | Consumes from this record |
|---|---|
| [#14](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/14) canonical contracts | Currency, exchange, source, dual timestamps, freshness, and schema-version fields; capability/availability states (§5, §9) |
| [#15](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/15) ingestion | Provider adapter boundary, auth model, cadence, session policy, quota budget, stale-state calculation (§8, §10, §12) |
| [#16](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/16) persistence and security | Retention rules and latest-quote write pattern (§13) |
| [#20](https://github.com/AyfordAndCo/portfolio-mini-mobile-app/issues/20) freshness display | Freshness states, thresholds, and the two-timestamp rule (§9) |

## 18. Open items requiring owner action

These cannot be closed by repository work and are the reason issue #13 remains open:

- [ ] Obtain and file the provider's written confirmation of display and redistribution rights for the app's intended use (the "in writing" acceptance criterion in §16).
- [ ] Confirm the commercial terms, any minimum commitment, and the invoicing entity.
- [ ] Confirm whether an API key or a signed agreement is required before sandbox access is granted.
- [ ] Confirm **JSE-listed ETF/ETN coverage** for the selected provider (§5) — unproven for every candidate.
- [ ] Confirm the provider supports a **bulk/multi-symbol quote endpoint** (§10.1) — without it the call volume is ~51,000/day and no ordinary tier will serve it.

### 18.1 Questions to put to vendors

These are the questions the public record could not answer. Research could not close them because the JSE website and policy PDFs are Cloudflare-protected (HTTP 403 to every fetch route) and vendors publish no terms for this use case.

**To the JSE (Market Data / Information Services):**
1. Is the **DataBP marketplace storefront live**, and will it sell to a small non-Professional app?
2. Does the JSE require a **separate display licence** when data is obtained through an authorised redistributor — as ASX does when it restricts display to internal use regardless of vendor tier?
3. Can a small app license **delayed (15-minute) equity + ETF data + SENS for end-user display**, at what per-user/display fee, and with what minimum commitment?
4. Which **authorised redistributors** should a small app approach?

**To ProfileData (the recommended candidate):**
1. Is there an **indicative price** for a closed user group of a few thousand retail app users?
2. Do you hold **JSE redistribution rights** for 15-minute delayed display in a third-party mobile app, and does your on-distribution model cover **mobile**?
3. Do you supply JSE **ETF/ETN** prices, distributions, and **constituent look-through**?
4. What are your **API rate limits**, is there a **bulk quote endpoint**, and what SLA applies?
5. Are your prices **exchange-sourced** (gate 2)? This is unstated and unresolved.

**To Twelve Data (fallback):**
1. Does an `XJSE` subscription include **commercial display in a consumer mobile app**?
2. What does the **Redistribution Rights Add-on** cost, and is a **separate JSE licence** required?
3. Is `XJSE` available on the **$149 Venture tier** or only Enterprise?
4. Is **bulk/multi-symbol quoting** supported, and what quota applies?
5. Is **JSE-listed ETF/ETN** coverage included?

**To Iress and Sharenet:**
1. Is any **small/self-serve or redistribution tier** available above the retail/non-professional licences, and at what price?

## 19. Sources

All claims above carry an inline source. Principal sources by section, accessed 2026-09-29:

- **JSE (§6.1, §4):** JSE market-data, equity-market-data, historical-data, market-announcements and data-agreements pages, retrieved via Wayback Machine snapshots (the live site returns HTTP 403 to automated fetches). JSE market-data policy and price-list PDFs could **not** be text-extracted and are marked `[•]`.
- **ProfileData (§4, §5, §6.2):** profile.co.za ShareData and financial-data pages (live).
- **Twelve Data (§4, §5, §7, §10):** twelvedata.com terms of use, business pricing, XJSE exchange page, and support articles on data add-ons and commercial/personal usage (live).
- **Rejected aggregators (§4, §7.4):** EODHD terms, commercial-pricing and API-limits pages; Tiingo EOD product and pricing pages; Finnhub terms and pricing; Alpha Vantage terms and premium pages; Marketstack product page; Financial Modeling Prep pricing; Intrinio pricing; Polygon docs.
- **Hosting, cost and limits (§11, §12):** Google Cloud documentation for Cloud Functions quotas, Cloud Scheduler pricing/quotas/retry, Cloud Run pricing/quotas/WebSockets, Secret Manager pricing, Firestore pricing/quotas/best practices, VPC network pricing; Firebase pricing, manage-functions and config-env pages.

**Evidence-quality caveats.** JSE primary evidence comes from archived snapshots rather than the live site; several JSE and vendor PDFs could not be parsed, so their contents are marked unverified rather than quoted. Cloud Scheduler's one-minute minimum is inferred from cron field granularity — no Google page states a minimum-frequency figure. The Expo `EXPO_PUBLIC_*` page was not fetched (§12.4).
