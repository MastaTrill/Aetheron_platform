import React, {useState} from 'react';
import {Text, StyleSheet, ScrollView, Alert} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useWeb3} from '@context/Web3Context';
import {useAetheron} from '@hooks/useAetheron';
import {Card, Button, Input, LoadingSpinner} from '../components';
import {theme} from '@config/theme';

export const WalletScreen: React.FC = () => {
  const {address, disconnect} = useWeb3();
  const {balance, transfer, isLoading} = useAetheron();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  const copyAddress = () => {
    if (address) {
      Clipboard.setString(address);
      Alert.alert('Copied!', 'Address copied to clipboard');
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please enter recipient and amount');
      return;
    }

    try {
      setIsSending(true);
      await transfer(recipient, amount);
      Alert.alert('Success', 'Transfer completed successfully');
      setRecipient('');
      setAmount('');
    } catch (error) {
      Alert.alert('Error', 'Transfer failed. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert('Disconnect Wallet', 'Are you sure you want to disconnect?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Disconnect', onPress: disconnect, style: 'destructive'},
    ]);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Balance Card */}
      <Card title="💰 Balance">
        <Text style={styles.balanceAmount}>{balance.balanceFormatted}</Text>
        <Text style={styles.balanceLabel}>AETH</Text>
      </Card>

      {/* Address Card */}
      <Card title="📍 Your Address">
        <Text style={styles.addressText} numberOfLines={1}>
          {address}
        </Text>
        <Button
          title="Copy Address"
          onPress={copyAddress}
          variant="outline"
          size="small"
          style={styles.copyButton}
        />
      </Card>

      {/* Send Tokens */}
      <Card title="📤 Send AETH">
        <Input
          label="Recipient Address"
          value={recipient}
          onChangeText={setRecipient}
          placeholder="0x..."
          autoCapitalize="none"
        />
        <Input
          label="Amount (AETH)"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
        />
        <Button
          title="Send"
          onPress={handleTransfer}
          loading={isSending}
          disabled={!recipient || !amount}
          fullWidth
        />
      </Card>

      {/* Quick Actions */}
      <Card title="⚙️ Settings">
        <Button title="Disconnect Wallet" onPress={handleDisconnect} variant="danger" fullWidth />
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
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  balanceLabel: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  addressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  copyButton: {
    marginTop: theme.spacing.sm,
  },
});
