import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Modal} from 'react-native';
import {TOKEN_LIST} from '../config/tokenlist';
import {theme} from '@config/theme';

interface TokenSelectProps {
  visible: boolean;
  onSelect: (token: any) => void;
  onClose: () => void;
  selected?: string;
}

export const TokenSelectModal: React.FC<TokenSelectProps> = ({
  visible,
  onSelect,
  onClose,
  selected,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Token</Text>
          <FlatList
            data={TOKEN_LIST}
            keyExtractor={item => item.address}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.item, selected === item.address && styles.selected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}>
                <Image
                  source={typeof item.logo === 'string' ? {uri: item.logo} : item.logo}
                  style={styles.logo}
                />
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.name}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  title: {fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: theme.colors.text},
  item: {flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8},
  selected: {backgroundColor: theme.colors.primary + '22'},
  logo: {width: 32, height: 32, marginRight: 12, borderRadius: 16},
  symbol: {fontWeight: 'bold', fontSize: 16, color: theme.colors.text, marginRight: 8},
  name: {color: theme.colors.textSecondary, fontSize: 14},
  closeBtn: {marginTop: 12, alignSelf: 'center'},
  closeText: {color: theme.colors.primary, fontWeight: 'bold', fontSize: 16},
});
