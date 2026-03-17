import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {useWeb3} from '../context/Web3Context';
import {useSwapHistory} from '../hooks/useSwapHistory';

type Transaction = {
  hash: string;
  value: string;
  timeStamp: string;
  isError: string;
};

type SwapHistoryItem = {
  from: {symbol: string; address: string};
  to: {symbol: string; address: string};
  amount: string;
  minReceived: string;
  priceImpact: string;
  time: number;
  hash?: string;
};

const POLYGONSCAN_API_KEY = '';
const POLYGONSCAN_API = 'https://api.polygonscan.com/api';

export const ActivityScreen = () => {
  const {address} = useWeb3();
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [showSwaps, setShowSwaps] = useState(false);
  const {history: swapHistory} = useSwapHistory() as {history: SwapHistoryItem[]};

  const fetchTxs = () => {
    if (!address) {
      return;
    }
    setLoading(true);
    setError('');
    fetch(
      `${POLYGONSCAN_API}?module=account&action=txlist&address=${address}&sort=desc&apikey=${POLYGONSCAN_API_KEY}`,
    )
      .then(res => res.json())
      .then(data => {
        if (data.status === '1') {
          setTxs(data.result);
        } else {
          setError(data.message || 'No transactions found.');
        }
      })
      .catch(e => setError('Failed to fetch transactions. ' + (e.message || '')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!showSwaps) {
      fetchTxs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, showSwaps]);

  if (!address) {
    return <Text style={styles.info}>Connect your wallet to view activity.</Text>;
  }
  if (loading && !showSwaps) {
    return <ActivityIndicator style={{marginTop: 32}} />;
  }
  if (error && !showSwaps) {
    return (
      <View style={{marginTop: 32, alignItems: 'center'}}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={fetchTxs} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
        <Text style={{fontWeight: 'bold', fontSize: 16, marginRight: 8}}>Recent Activity</Text>
        <Switch
          value={showSwaps}
          onValueChange={setShowSwaps}
          thumbColor={showSwaps ? '#0ff' : '#888'}
          trackColor={{false: '#444', true: '#0ff'}}
        />
        <Text style={{marginLeft: 8, color: showSwaps ? '#0ff' : '#888'}}>Swaps</Text>
      </View>
      {showSwaps ? (
        <FlatList
          data={swapHistory}
          keyExtractor={(item, idx) => item.hash || String(idx)}
          renderItem={({item}: {item: SwapHistoryItem}) => (
            <View style={styles.item}>
              <Text style={styles.hash}>
                {item.hash ? item.hash.slice(0, 10) + '...' : 'Local'}
              </Text>
              <Text style={styles.type}>
                {item.amount} {item.from.symbol} → {item.minReceived} {item.to.symbol}
              </Text>
              <Text style={styles.date}>{new Date(item.time).toLocaleString()}</Text>
              <Text style={styles.success}>Swap</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.info}>No swaps found for this address.</Text>}
        />
      ) : (
        <FlatList
          data={txs}
          keyExtractor={item => item.hash}
          renderItem={({item}: {item: Transaction}) => (
            <View style={styles.item}>
              <Text style={styles.hash}>{item.hash.slice(0, 10)}...</Text>
              <Text style={styles.type}>{parseFloat(item.value) / 1e18} MATIC</Text>
              <Text style={styles.date}>
                {new Date(Number(item.timeStamp) * 1000).toLocaleString()}
              </Text>
              <Text style={item.isError === '0' ? styles.success : styles.fail}>
                {item.isError === '0' ? 'Success' : 'Failed'}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.info}>No transactions found for this address.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  title: {fontSize: 20, fontWeight: 'bold', marginBottom: 16},
  item: {marginBottom: 16, padding: 12, backgroundColor: '#222', borderRadius: 8},
  hash: {color: '#fff', fontSize: 12},
  type: {color: '#0ff', fontWeight: 'bold'},
  date: {color: '#aaa', fontSize: 12},
  success: {color: '#0f0'},
  fail: {color: '#f00'},
  info: {color: '#888', textAlign: 'center', marginTop: 32},
  error: {color: '#f00', textAlign: 'center', marginTop: 32},
  retryBtn: {marginTop: 12, padding: 8, backgroundColor: '#333', borderRadius: 6},
  retryText: {color: '#0ff', fontWeight: 'bold'},
});
