import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert} from 'react-native';
import {useWeb3} from '../context/Web3Context';
import {Card} from '../components/Card';
import {Button} from '../components/Button';
import {theme} from '../config/theme';

interface TradeSignal {
  id: string;
  trader: string;
  token: string;
  action: 'BUY' | 'SELL';
  price: number;
  timestamp: number;
  confidence: number;
}

export const SocialTradingScreen: React.FC = () => {
  const {isConnected} = useWeb3();
  const [tradeSignals, setTradeSignals] = useState<TradeSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followTrader, setFollowTrader] = useState('');

  useEffect(() => {
    if (isConnected) {
      loadTradeSignals();
    }
  }, [isConnected]);

  const loadTradeSignals = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real app, this would come from smart contracts or API
      const mockSignals: TradeSignal[] = [
        {
          id: '1',
          trader: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          token: 'ETH',
          action: 'BUY',
          price: 2450.5,
          timestamp: Date.now() - 3600000,
          confidence: 85,
        },
        {
          id: '2',
          trader: '0x8ba1f109551bD4328030126452617686AF61172',
          token: 'BTC',
          action: 'SELL',
          price: 43200.0,
          timestamp: Date.now() - 7200000,
          confidence: 92,
        },
      ];
      setTradeSignals(mockSignals);
    } catch (error) {
      console.error('Error loading trade signals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const followTraderAction = async () => {
    if (!followTrader.trim()) {
      Alert.alert('Error', 'Please enter a trader address');
      return;
    }

    try {
      // Mock follow action - in real app, this would interact with smart contracts
      Alert.alert('Success', `Now following trader ${followTrader}`);
      setFollowTrader('');
    } catch (error) {
      Alert.alert('Error', 'Failed to follow trader');
    }
  };

  const copyToClipboard = (_signal: TradeSignal) => {
    // In real app, use Clipboard.setString
    Alert.alert('Copied', 'Trade signal copied to clipboard');
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Social Trading</Text>
          <Text style={styles.subtitle}>Connect your wallet to access social trading features</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Trading</Text>
        <Text style={styles.headerSubtitle}>
          Follow successful traders and copy their strategies
        </Text>
      </View>

      {/* Follow Trader Section */}
      <Card style={styles.followCard}>
        <Text style={styles.sectionTitle}>Follow a Trader</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter trader address (0x...)"
          value={followTrader}
          onChangeText={setFollowTrader}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Button title="Follow Trader" onPress={followTraderAction} style={styles.followButton} />
      </Card>

      {/* Trade Signals */}
      <View style={styles.signalsSection}>
        <Text style={styles.sectionTitle}>Recent Trade Signals</Text>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading signals...</Text>
        ) : (
          tradeSignals.map(signal => (
            <Card key={signal.id} style={styles.signalCard}>
              <View style={styles.signalHeader}>
                <View style={styles.traderInfo}>
                  <Text style={styles.traderAddress}>
                    {signal.trader.substring(0, 6)}...
                    {signal.trader.substring(signal.trader.length - 4)}
                  </Text>
                  <Text style={styles.timestamp}>
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{signal.confidence}%</Text>
                </View>
              </View>

              <View style={styles.signalDetails}>
                <Text style={styles.tokenText}>{signal.token}</Text>
                <Text
                  style={[
                    styles.actionText,
                    signal.action === 'BUY' ? styles.buyAction : styles.sellAction,
                  ]}>
                  {signal.action}
                </Text>
                <Text style={styles.priceText}>${signal.price.toFixed(2)}</Text>
              </View>

              <TouchableOpacity style={styles.copyButton} onPress={() => copyToClipboard(signal)}>
                <Text style={styles.copyButtonText}>Copy Trade</Text>
              </TouchableOpacity>
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
  followCard: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
    marginBottom: 12,
  },
  followButton: {
    marginTop: 8,
  },
  signalsSection: {
    padding: 20,
    paddingTop: 0,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  signalCard: {
    marginBottom: 12,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  traderInfo: {
    flex: 1,
  },
  traderAddress: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  signalDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  buyAction: {
    color: '#00C853',
  },
  sellAction: {
    color: '#FF1744',
  },
  priceText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
