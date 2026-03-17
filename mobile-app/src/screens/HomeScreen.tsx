import React from 'react';
import {View, Text, StyleSheet, ScrollView, Linking} from 'react-native';
import {useWeb3} from '@context/Web3Context';
import {useAetheron} from '@hooks/useAetheron';
import {useStaking} from '@hooks/useStaking';
import {Card} from '@components/Card';
import {Button} from '@components/Button';
import {LoadingSpinner} from '@components/LoadingSpinner';
import {theme} from '@config/theme';
import {LINKS} from '@config/contracts';

export const HomeScreen: React.FC = () => {
  const {isConnected, address, connect, isConnecting} = useWeb3();
  const {balance, isLoading: balanceLoading} = useAetheron();
  const {stakingInfo, isLoading: stakingLoading} = useStaking();

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.logo}>🌌</Text>
          <Text style={styles.title}>Aetheron</Text>
          <Text style={styles.subtitle}>Space Exploration & DeFi Platform</Text>

          <Button
            title="Connect Wallet"
            onPress={connect}
            loading={isConnecting}
            style={styles.connectButton}
            fullWidth
          />

          <Text style={styles.infoText}>
            Connect your wallet to access staking, trading, and more
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aetheron Dashboard</Text>
        <Text style={styles.addressText}>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </Text>
      </View>

      {/* Balance Card */}
      <Card title="💰 Your Balance">
        {balanceLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <Text style={styles.balanceAmount}>{balance.balanceFormatted}</Text>
            <Text style={styles.balanceLabel}>AETH</Text>
          </>
        )}
      </Card>

      {/* Staking Card */}
      <Card title="🎯 Staking Info">
        {stakingLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <View style={styles.stakingRow}>
              <Text style={styles.stakingLabel}>Staked Amount:</Text>
              <Text style={styles.stakingValue}>{stakingInfo.stakedAmountFormatted} AETH</Text>
            </View>
            <View style={styles.stakingRow}>
              <Text style={styles.stakingLabel}>Pending Rewards:</Text>
              <Text style={styles.stakingValue}>{stakingInfo.pendingRewardsFormatted} AETH</Text>
            </View>
            <View style={styles.stakingRow}>
              <Text style={styles.stakingLabel}>Total Staked:</Text>
              <Text style={styles.stakingValue}>
                {parseFloat(stakingInfo.totalStaked).toFixed(2)} AETH
              </Text>
            </View>
          </>
        )}
      </Card>

      {/* Quick Actions */}
      <Card title="⚡ Quick Actions">
        <View style={styles.actionGrid}>
          <Button
            title="Buy AETH"
            onPress={() => openLink(LINKS.BUY_QUICKSWAP)}
            variant="primary"
            size="small"
            style={styles.actionButton}
          />
          <Button
            title="View Chart"
            onPress={() => openLink(LINKS.DEXTOOLS)}
            variant="secondary"
            size="small"
            style={styles.actionButton}
          />
        </View>
        <View style={styles.actionGrid}>
          <Button
            title="PolygonScan"
            onPress={() => openLink(LINKS.POLYGONSCAN_TOKEN)}
            variant="outline"
            size="small"
            style={styles.actionButton}
          />
          <Button
            title="Website"
            onPress={() => openLink(LINKS.WEBSITE)}
            variant="outline"
            size="small"
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* Features */}
      <Card title="🚀 Features">
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>💼</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Wallet</Text>
            <Text style={styles.featureDesc}>Manage your AETH tokens</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🎯</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Staking</Text>
            <Text style={styles.featureDesc}>Stake and earn rewards</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🔄</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Swap</Text>
            <Text style={styles.featureDesc}>Trade on QuickSwap</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  logo: {
    fontSize: 80,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  connectButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  addressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  balanceLabel: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  stakingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  stakingLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  stakingValue: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  featureDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
