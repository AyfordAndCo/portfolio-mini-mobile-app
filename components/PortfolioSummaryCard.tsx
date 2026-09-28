import { StyleSheet, Text, View } from 'react-native';

import {
  getHoldingMarketValue,
  getHoldingProfitLoss,
  getProfitLossPercentage,
  getPortfolioSummary,
} from '../app/portfolioCalculations';
import type { PortfolioHolding } from '../types/portfolio';
import { formatCurrency } from '../utils/formatCurrency';

type PortfolioSummaryCardProps = {
  holdings: PortfolioHolding[];
};

export function PortfolioSummaryCard({
  holdings,
}: PortfolioSummaryCardProps) {
  const summary = getPortfolioSummary(holdings);
  const profitLossPercentage = getProfitLossPercentage(summary);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>MARKET VALUE</Text>
      <Text style={styles.total}>{formatCurrency(summary.marketValue)}</Text>
      <Text style={[styles.profitLoss, summary.profitLoss < 0 ? styles.lossText : styles.gainText]}>
        {summary.profitLoss >= 0 ? '+' : ''}
        {formatCurrency(summary.profitLoss)} profit/loss ({profitLossPercentage.toFixed(0)}%)
      </Text>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Cost value</Text>
          <Text style={styles.metricValue}>{formatCurrency(summary.costBasis)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Profit %</Text>
          <Text style={[styles.metricValue, summary.profitLoss < 0 ? styles.lossText : styles.gainText]}>
            {profitLossPercentage.toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {holdings.length === 0 ? (
        <Text style={styles.emptyText}>No holdings saved yet.</Text>
      ) : (
        holdings.map((holding) => {
          const marketValue = getHoldingMarketValue(holding);
          const profitLoss = getHoldingProfitLoss(holding);

          return (
            <View key={holding.id} style={styles.row}>
              <View style={styles.holdingText}>
                <Text style={styles.name}>{holding.ticker}</Text>
                <Text style={styles.detail}>
                  {holding.quantity} x {formatCurrency(holding.currentPrice)}
                </Text>
              </View>
              <View style={styles.valueGroup}>
                <Text style={styles.value}>{formatCurrency(marketValue)}</Text>
                <Text style={[styles.detail, profitLoss < 0 ? styles.lossText : styles.gainText]}>
                  {profitLoss >= 0 ? '+' : ''}
                  {formatCurrency(profitLoss)}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    maxWidth: '100%',
    padding: 24,
    borderColor: '#DCE3DC',
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  label: {
    color: '#718078',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  total: {
    marginTop: 8,
    color: '#142018',
    fontSize: 32,
    fontWeight: '700',
  },
  profitLoss: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    padding: 12,
  },
  metricLabel: {
    color: '#718078',
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    marginTop: 6,
    color: '#142018',
    fontSize: 16,
    fontWeight: '700',
  },
  gainText: {
    color: '#287247',
  },
  lossText: {
    color: '#B42318',
  },
  divider: {
    height: 1,
    marginVertical: 24,
    backgroundColor: '#E8ECE8',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  holdingText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: '#3C4941',
    fontSize: 15,
    fontWeight: '700',
  },
  detail: {
    marginTop: 4,
    color: '#718078',
    fontSize: 12,
  },
  valueGroup: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  value: {
    color: '#142018',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    color: '#607067',
    fontSize: 14,
    lineHeight: 20,
  },
});
