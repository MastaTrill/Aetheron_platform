import React from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {theme} from '@config/theme';

type Token = {symbol: string};

interface ConfirmSwapModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fromToken?: Token;
  toToken?: Token;
  amount?: string;
  minReceived?: string;
  priceImpact?: string;
  fee?: string;
}

export function ConfirmSwapModal({
  visible,
  onConfirm,
  onCancel,
  fromToken,
  toToken,
  amount,
  minReceived,
  priceImpact,
  fee,
}: ConfirmSwapModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Confirm Swap</Text>
          <Text style={styles.row}>
            From:{' '}
            <Text style={styles.bold}>
              {amount} {fromToken?.symbol}
            </Text>
          </Text>
          <Text style={styles.row}>
            To:{' '}
            <Text style={styles.bold}>
              {minReceived} {toToken?.symbol}
            </Text>
          </Text>
          <Text style={styles.row}>
            Price Impact: <Text style={styles.bold}>{priceImpact}%</Text>
          </Text>
          <Text style={styles.row}>
            Estimated Fee: <Text style={styles.bold}>{fee}</Text>
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.confirm} onPress={onConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancel} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {backgroundColor: theme.colors.background, borderRadius: 12, padding: 24, width: '85%'},
  title: {fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: theme.colors.text},
  row: {fontSize: 16, color: theme.colors.text, marginBottom: 8},
  bold: {fontWeight: 'bold', color: theme.colors.primary},
  actions: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 24},
  confirm: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  confirmText: {color: '#fff', textAlign: 'center', fontWeight: 'bold'},
  cancel: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  cancelText: {color: theme.colors.text, textAlign: 'center', fontWeight: 'bold'},
});
