import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {theme} from '@config/theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({children, title, style}) => {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
});
