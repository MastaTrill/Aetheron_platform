
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SWAP_HISTORY_KEY = 'swap_history';

export type SwapHistoryItem = {
  from: { symbol: string; address: string };
  to: { symbol: string; address: string };
  amount: string;
  minReceived: string;
  priceImpact: string;
  time: number;
  hash?: string;
};

export function useSwapHistory(): {
  history: SwapHistoryItem[];
  addSwap: (swap: SwapHistoryItem) => Promise<void>;
} {
  const [history, setHistory] = useState<SwapHistoryItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(SWAP_HISTORY_KEY).then(data => {
      if (data) setHistory(JSON.parse(data));
    });
  }, []);

  const addSwap = async (swap: SwapHistoryItem) => {
    const newHistory = [swap, ...history].slice(0, 20); // keep last 20
    setHistory(newHistory);
    await AsyncStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(newHistory));
  };

  return { history, addSwap };
}
