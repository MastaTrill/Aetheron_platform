import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Card, Button, TokenSelectModal, ConfirmSwapModal} from '../components';
import {theme} from '@config/theme';
import {LINKS} from '@config/contracts';
import {ethers} from 'ethers';
import {useWeb3} from '../context/Web3Context';
import {TOKEN_LIST} from '../config/tokenlist';
import {useSwapQuote} from '../hooks/useSwapQuote';
import {logSwapEvent, logScreenView} from '../analytics/events';
import {useSwapHistory} from '../hooks/useSwapHistory';

// Define SwapHistoryItem type for swap history
type SwapHistoryItem = {
  from: {symbol: string; address: string};
  to: {symbol: string; address: string};
  amount: string;
  minReceived: string;
  priceImpact: string;
  time: number;
  hash?: string;
};

// QuickSwap Router address and ABI (simplified for swapExactETHForTokens)
const QUICKSWAP_ROUTER = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';
const ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)',
];

export const SwapScreen: React.FC = () => {
  const openQuickSwap = () => {
    Linking.openURL(LINKS.BUY_QUICKSWAP);
  };
  const openDexTools = () => {
    Linking.openURL(LINKS.DEXTOOLS);
  };
  const openDexScreener = () => {
    Linking.openURL(LINKS.DEXSCREENER);
  };

  // In-app swap state
  const {provider, address} = useWeb3();
  const [amount, setAmount] = useState('');
  const [fromToken, setFromToken] = useState(TOKEN_LIST[0]); // default: MATIC
  const [toToken, setToToken] = useState(TOKEN_LIST[1]); // default: AETH
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [slippage, setSlippage] = useState('1');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Quote for min received and price impact (pass slippage)
  const quote = useSwapQuote(fromToken, toToken, amount, slippage);
  // Swap history
  const {history, addSwap} = useSwapHistory() as {
    history: SwapHistoryItem[];
    addSwap: (item: SwapHistoryItem) => void;
  };

  // Track screen view
  React.useEffect(() => {
    logScreenView('SwapScreen');
  }, []);

  const handleSwap = () => {
    if (!provider || !address) {
      return Alert.alert('Connect your wallet');
    }
    if (!amount || !fromToken || !toToken) {
      return Alert.alert('Enter amount and select tokens');
    }
    if (fromToken.address === toToken.address) {
      return Alert.alert('Select different tokens');
    }
    if (quote.error) {
      return Alert.alert('Swap unavailable', quote.error);
    }
    setShowConfirm(true);
  };

  const executeSwap = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }
      const signer = await provider.getSigner();
      const router = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, signer);
      // Support token-to-token swaps (not just MATIC -> token)
      let value = '0';
      let method = 'swapExactETHForTokens';
      let path = [fromToken.address, toToken.address];
      if (fromToken.symbol === 'MATIC') {
        path = [ethers.ZeroAddress, toToken.address];
        value = ethers.parseEther(amount).toString();
        method = 'swapExactETHForTokens';
      } else if (toToken.symbol === 'MATIC') {
        path = [fromToken.address, ethers.ZeroAddress];
        method = 'swapExactTokensForETH';
      } else {
        method = 'swapExactTokensForTokens';
      }
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
      // Calculate amountOutMin using slippage from quote
      if (quote.error) {
        throw new Error(quote.error);
      }
      if (!quote.minReceived || !toToken?.decimals) {
        throw new Error('Unable to calculate minimum received amount. Please try again.');
      }
      // Check for zero or near-zero minReceived
      const minReceivedNum = parseFloat(quote.minReceived);
      if (isNaN(minReceivedNum) || minReceivedNum <= 0) {
        throw new Error('Swap would result in no tokens received. Adjust amount or slippage.');
      }
      const amountOutMin = ethers.parseUnits(quote.minReceived, toToken.decimals);
      let tx;
      if (method === 'swapExactETHForTokens') {
        tx = await router.swapExactETHForTokens(amountOutMin, path, address, deadline, {value});
      } else if (method === 'swapExactTokensForETH') {
        tx = await router.swapExactTokensForETH(
          ethers.parseUnits(amount, fromToken.decimals),
          amountOutMin,
          path,
          address,
          deadline,
        );
      } else {
        tx = await router.swapExactTokensForTokens(
          ethers.parseUnits(amount, fromToken.decimals),
          amountOutMin,
          path,
          address,
          deadline,
        );
      }
      await tx.wait();
      addSwap({
        from: {symbol: fromToken.symbol, address: fromToken.address},
        to: {symbol: toToken.symbol, address: toToken.address},
        amount,
        minReceived: quote.minReceived,
        priceImpact: quote.priceImpact,
        time: Date.now(),
        hash: tx.hash,
      });
      logSwapEvent({
        fromToken,
        toToken,
        amount,
        minReceived: quote.minReceived,
        priceImpact: quote.priceImpact,
        hash: tx.hash,
      });
      Alert.alert('Swap successful!');
    } catch (e) {
      let message = 'Unknown error';
      if (typeof e === 'object' && e && 'message' in e && typeof (e as any).message === 'string') {
        message = (e as any).message;
      } else if (typeof e === 'string') {
        message = e;
      }
      Alert.alert('Swap failed', message);
    } finally {
      setLoading(false);
    }
  };

  // ...

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card title="🔄 In-App Swap">
        <Text style={styles.description}>Swap tokens instantly on Polygon using QuickSwap.</Text>
        <View style={{flexDirection: 'row', marginBottom: 12}}>
          <Button
            title={fromToken.symbol}
            onPress={() => setShowFromModal(true)}
            style={{flex: 1, marginRight: 8}}
            variant="secondary"
          />
          <Button
            title={toToken.symbol}
            onPress={() => setShowToModal(true)}
            style={{flex: 1, marginLeft: 8}}
            variant="secondary"
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder={`Amount in ${fromToken.symbol}`}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TextInput
          style={styles.input}
          placeholder="Slippage (%)"
          keyboardType="decimal-pad"
          value={slippage}
          onChangeText={setSlippage}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <View style={{marginBottom: 8}}>
          <Text style={{color: theme.colors.textSecondary}}>
            Min received:{' '}
            {quote.loading
              ? '...'
              : quote.minReceived
              ? `${quote.minReceived} ${toToken.symbol}`
              : '-'}
          </Text>
          <Text style={{color: theme.colors.textSecondary}}>
            Price impact:{' '}
            {quote.loading ? '...' : quote.priceImpact ? `${quote.priceImpact}%` : '-'}
          </Text>
          {quote.error ? <Text style={{color: theme.colors.error}}>{quote.error}</Text> : null}
        </View>
        <Button
          title="Swap"
          onPress={handleSwap}
          disabled={loading}
          fullWidth
          style={styles.button}
        />
        <ConfirmSwapModal
          visible={showConfirm}
          onConfirm={executeSwap}
          onCancel={() => setShowConfirm(false)}
          fromToken={fromToken}
          toToken={toToken}
          amount={amount}
          minReceived={quote.minReceived}
          priceImpact={quote.priceImpact}
          fee={loading ? '...' : 'Estimate (see wallet)'}
        />
        {loading && <ActivityIndicator style={{marginTop: 16}} />}
        <TokenSelectModal
          visible={showFromModal}
          onSelect={setFromToken}
          onClose={() => setShowFromModal(false)}
          selected={fromToken.address}
        />
        <TokenSelectModal
          visible={showToModal}
          onSelect={setToToken}
          onClose={() => setShowToModal(false)}
          selected={toToken.address}
        />
      </Card>
      <Card title="🕒 Swap History">
        {history.length === 0 ? (
          <Text style={{color: theme.colors.textSecondary}}>No swaps yet.</Text>
        ) : (
          history.map((item, idx) => (
            <View key={item.hash || idx} style={{marginBottom: 8}}>
              <Text style={{color: theme.colors.text}}>
                {item.amount} {item.from.symbol} → {item.minReceived} {item.to.symbol}
              </Text>
              <Text style={{color: theme.colors.textSecondary, fontSize: 12}}>
                {new Date(item.time).toLocaleString()}
              </Text>
              <Text style={{color: theme.colors.primary, fontSize: 12}}>
                {item.hash?.slice(0, 10)}...
              </Text>
            </View>
          ))
        )}
      </Card>
      <Card title="🔄 Swap AETH (External)">
        <Text style={styles.description}>
          Trade AETH tokens on QuickSwap, the leading DEX on Polygon network.
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Swapping will redirect you to QuickSwap where you can trade AETH for other tokens.
          </Text>
        </View>
        <Button title="Open QuickSwap" onPress={openQuickSwap} fullWidth style={styles.button} />
      </Card>

      <Card title="📊 Market Data">
        <Text style={styles.description}>
          View real-time charts and trading analytics for AETH token.
        </Text>

        <Button
          title="DexTools Chart"
          onPress={openDexTools}
          variant="secondary"
          fullWidth
          style={styles.button}
        />

        <Button
          title="DexScreener"
          onPress={openDexScreener}
          variant="secondary"
          fullWidth
          style={styles.button}
        />
      </Card>

      <Card title="ℹ️ Trading Tips">
        <View style={styles.tipItem}>
          <Text style={styles.tipNumber}>1.</Text>
          <Text style={styles.tipText}>Make sure you have enough MATIC for gas fees</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipNumber}>2.</Text>
          <Text style={styles.tipText}>
            Set slippage tolerance appropriately (usually 0.5% - 3%)
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipNumber}>3.</Text>
          <Text style={styles.tipText}>Always verify the contract address before trading</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipNumber}>4.</Text>
          <Text style={styles.tipText}>Check liquidity depth before large trades</Text>
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
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    marginBottom: theme.spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  tipNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
    width: 24,
  },
  tipText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    backgroundColor: theme.colors.card,
  },
});
