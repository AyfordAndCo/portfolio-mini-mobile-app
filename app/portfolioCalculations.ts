import type { PortfolioHolding, PortfolioSummary } from '../types/portfolio';

export function getHoldingMarketValue(holding: PortfolioHolding): number {
  return holding.quantity * holding.currentPrice;
}

export function getHoldingCostBasis(holding: PortfolioHolding): number {
  return holding.quantity * holding.averagePurchasePrice;
}

export function getHoldingProfitLoss(holding: PortfolioHolding): number {
  return getHoldingMarketValue(holding) - getHoldingCostBasis(holding);
}

export function getPortfolioSummary(holdings: PortfolioHolding[]): PortfolioSummary {
  return holdings.reduce<PortfolioSummary>(
    (summary, holding) => {
      const marketValue = getHoldingMarketValue(holding);
      const costBasis = getHoldingCostBasis(holding);

      return {
        marketValue: summary.marketValue + marketValue,
        costBasis: summary.costBasis + costBasis,
        profitLoss: summary.profitLoss + marketValue - costBasis,
      };
    },
    { marketValue: 0, costBasis: 0, profitLoss: 0 },
  );
}

export function getProfitLossPercentage(summary: PortfolioSummary): number {
  if (summary.costBasis === 0) {
    return 0;
  }

  return (summary.profitLoss / summary.costBasis) * 100;
}
