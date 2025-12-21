
import analytics from '@react-native-firebase/analytics';

type Token = { symbol: string };

interface SwapEvent {
  fromToken: Token;
  toToken: Token;
  amount: string;
  minReceived: string;
  priceImpact: string;
  hash: string;
}

export async function logSwapEvent({ fromToken, toToken, amount, minReceived, priceImpact, hash }: SwapEvent) {
  await analytics().logEvent('swap', {
    from_token: fromToken.symbol,
    to_token: toToken.symbol,
    amount,
    min_received: minReceived,
    price_impact: priceImpact,
    tx_hash: hash,
  });
}

export async function logScreenView(screen_name: string) {
  await analytics().logScreenView({ screen_name, screen_class: screen_name });
}
