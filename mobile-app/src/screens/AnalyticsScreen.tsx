import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions} from 'react-native';
import {useWeb3} from '../context/Web3Context';
import {Card} from '../components/Card';
import {theme} from '../config/theme';

const {width} = Dimensions.get('window');

interface AnalyticsData {
  totalValue: number;
  totalYield: number;
  portfolioChange: number;
  activePositions: number;
  topPerformingAsset: string;
  riskScore: number;
}

export const AnalyticsScreen: React.FC = () => {
  const {isConnected} = useWeb3();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('30D');

  useEffect(() => {
    if (isConnected) {
      loadAnalytics();
    }
  }, [isConnected, timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real app, this would aggregate from various DeFi protocols and user's positions
      const mockData: AnalyticsData = {
        totalValue: 15420.5,
        totalYield: 1247.8,
        portfolioChange: 8.5,
        activePositions: 12,
        topPerformingAsset: 'ETH',
        riskScore: 65,
      };
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) {
      return '#00C853';
    }
    if (score < 70) {
      return '#FF9800';
    }
    return '#FF1744';
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) {
      return 'Low';
    }
    if (score < 70) {
      return 'Medium';
    }
    return 'High';
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Connect your wallet to view portfolio analytics</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your DeFi performance and insights</Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {['7D', '30D', '90D'].map(range => (
          <TouchableOpacity
            key={range}
            style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange(range as any)}>
            <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <Text style={styles.loadingText}>Loading analytics...</Text>
      ) : analyticsData ? (
        <View style={styles.analyticsContainer}>
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Value</Text>
              <Text style={styles.metricValue}>${analyticsData.totalValue.toFixed(2)}</Text>
              <Text
                style={[
                  styles.metricChange,
                  analyticsData.portfolioChange >= 0 ? styles.positive : styles.negative,
                ]}>
                {analyticsData.portfolioChange >= 0 ? '+' : ''}
                {analyticsData.portfolioChange.toFixed(1)}%
              </Text>
            </Card>

            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Yield</Text>
              <Text style={styles.metricValue}>${analyticsData.totalYield.toFixed(2)}</Text>
              <Text style={styles.metricSubtext}>This period</Text>
            </Card>

            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Active Positions</Text>
              <Text style={styles.metricValue}>{analyticsData.activePositions}</Text>
              <Text style={styles.metricSubtext}>Across protocols</Text>
            </Card>

            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Risk Score</Text>
              <Text style={[styles.metricValue, {color: getRiskColor(analyticsData.riskScore)}]}>
                {analyticsData.riskScore}
              </Text>
              <Text style={styles.metricSubtext}>{getRiskLabel(analyticsData.riskScore)} Risk</Text>
            </Card>
          </View>

          {/* Performance Insights */}
          <Card style={styles.insightsCard}>
            <Text style={styles.sectionTitle}>Performance Insights</Text>

            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Top Performing Asset:</Text>
              <Text style={styles.insightValue}>{analyticsData.topPerformingAsset}</Text>
            </View>

            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Portfolio Health:</Text>
              <Text style={[styles.insightValue, {color: getRiskColor(analyticsData.riskScore)}]}>
                {getRiskLabel(analyticsData.riskScore)}
              </Text>
            </View>

            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Yield Generation:</Text>
              <Text style={styles.insightValue}>
                ${((analyticsData.totalYield / analyticsData.totalValue) * 100).toFixed(1)}% of
                portfolio
              </Text>
            </View>
          </Card>

          {/* Placeholder for Chart */}
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Portfolio Performance Chart</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>
                📊 Chart visualization would be implemented here{'\n'}
                (Using react-native-chart-kit or similar)
              </Text>
            </View>
          </Card>

          {/* Recent Activity */}
          <Card style={styles.activityCard}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>Deposited 2.5 ETH to Aave</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>Yield harvested: +$45.20</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>Swapped ETH for USDC on Uniswap</Text>
              <Text style={styles.activityTime}>2 days ago</Text>
            </View>
          </Card>
        </View>
      ) : (
        <Text style={styles.errorText}>Failed to load analytics data</Text>
      )}
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
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
    marginTop: 0,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeRangeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  timeRangeTextActive: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },
  errorText: {
    textAlign: 'center',
    color: '#FF1744',
    fontSize: 16,
    marginTop: 40,
  },
  analyticsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 40 - 20) / 2, // Two columns with padding
    marginBottom: 16,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positive: {
    color: '#00C853',
  },
  negative: {
    color: '#FF1744',
  },
  metricSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  insightsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  insightLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  insightValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  chartCard: {
    marginBottom: 20,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  activityCard: {
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  activityTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
