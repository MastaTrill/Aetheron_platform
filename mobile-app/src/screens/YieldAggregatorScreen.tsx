import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useWeb3} from '../context/Web3Context';
import {Card} from '../components/Card';
import {Button} from '../components/Button';
import {theme} from '../config/theme';

interface YieldOpportunity {
  id: string;
  protocol: string;
  token: string;
  apy: number;
  tvl: number;
  risk: 'Low' | 'Medium' | 'High';
  platform: string;
}

export const YieldAggregatorScreen: React.FC = () => {
  const {isConnected} = useWeb3();
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');

  useEffect(() => {
    if (isConnected) {
      loadYieldOpportunities();
    }
  }, [isConnected]);

  const loadYieldOpportunities = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real app, this would aggregate from multiple DeFi protocols
      const mockOpportunities: YieldOpportunity[] = [
        {
          id: '1',
          protocol: 'Aave',
          token: 'USDC',
          apy: 5.2,
          tvl: 1250000000,
          risk: 'Low',
          platform: 'Ethereum',
        },
        {
          id: '2',
          protocol: 'Compound',
          token: 'ETH',
          apy: 4.8,
          tvl: 890000000,
          risk: 'Low',
          platform: 'Ethereum',
        },
        {
          id: '3',
          protocol: 'Curve',
          token: '3Pool',
          apy: 8.5,
          tvl: 4500000000,
          risk: 'Medium',
          platform: 'Ethereum',
        },
        {
          id: '4',
          protocol: 'Uniswap V3',
          token: 'ETH/USDC',
          apy: 15.2,
          tvl: 210000000,
          risk: 'High',
          platform: 'Ethereum',
        },
      ];
      setOpportunities(mockOpportunities);
    } catch (error) {
      console.error('Error loading yield opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter(
    opp => selectedFilter === 'All' || opp.risk === selectedFilter,
  );

  const depositToProtocol = async (opportunity: YieldOpportunity) => {
    // In real app, this would integrate with the protocol's smart contracts
    console.log(`Depositing to ${opportunity.protocol} - ${opportunity.token}`);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return '#00C853';
      case 'Medium':
        return '#FF9800';
      case 'High':
        return '#FF1744';
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000000) {
      return `$${(tvl / 1000000000).toFixed(1)}B`;
    } else if (tvl >= 1000000) {
      return `$${(tvl / 1000000).toFixed(1)}M`;
    } else if (tvl >= 1000) {
      return `$${(tvl / 1000).toFixed(1)}K`;
    }
    return `$${tvl.toFixed(0)}`;
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Yield Aggregator</Text>
          <Text style={styles.subtitle}>
            Connect your wallet to discover yield farming opportunities
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yield Aggregator</Text>
        <Text style={styles.headerSubtitle}>
          Find the best yield farming opportunities across DeFi
        </Text>
      </View>

      {/* Risk Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filter by Risk:</Text>
        <View style={styles.filterButtons}>
          {['All', 'Low', 'Medium', 'High'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter as any)}>
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Yield Opportunities */}
      <View style={styles.opportunitiesSection}>
        <Text style={styles.sectionTitle}>Available Opportunities</Text>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading opportunities...</Text>
        ) : (
          filteredOpportunities.map(opportunity => (
            <Card key={opportunity.id} style={styles.opportunityCard}>
              <View style={styles.opportunityHeader}>
                <View style={styles.protocolInfo}>
                  <Text style={styles.protocolName}>{opportunity.protocol}</Text>
                  <Text style={styles.platformText}>{opportunity.platform}</Text>
                </View>
                <View style={styles.riskBadge}>
                  <Text style={[styles.riskText, {color: getRiskColor(opportunity.risk)}]}>
                    {opportunity.risk} Risk
                  </Text>
                </View>
              </View>

              <View style={styles.opportunityDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.tokenText}>{opportunity.token}</Text>
                  <Text style={styles.apyText}>{opportunity.apy.toFixed(1)}% APY</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.tvlLabel}>TVL:</Text>
                  <Text style={styles.tvlText}>{formatTVL(opportunity.tvl)}</Text>
                </View>
              </View>

              <Button
                title="Deposit"
                onPress={() => depositToProtocol(opportunity)}
                style={styles.depositButton}
                fullWidth
              />
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  filterSection: {
    padding: 20,
    paddingTop: 0,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  opportunitiesSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  opportunityCard: {
    marginBottom: 12,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  platformText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
  },
  riskText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  opportunityDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  apyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  tvlLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tvlText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  depositButton: {
    marginTop: 8,
  },
});
