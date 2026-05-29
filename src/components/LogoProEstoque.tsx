import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type LogoSize = 'sm' | 'md' | 'lg';

type LogoUniEatsProps = {
  size?: LogoSize;
};

const SIZE_MAP: Record<LogoSize, { icon: number; text: number; gap: number }> = {
  sm: { icon: 28, text: 22, gap: 8 },
  md: { icon: 36, text: 28, gap: 10 },
  lg: { icon: 44, text: 34, gap: 12 },
};

export function LogoUniEats({ size = 'md' }: LogoUniEatsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { icon, text, gap } = SIZE_MAP[size];

  return (
    <View style={[styles.root, { gap }]}> 
      <Ionicons name="restaurant-outline" size={icon} color={Colors.primary[600]} />
      <Text style={[styles.text, { color: theme.text, fontSize: text }]}>UniEats</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'System',
    fontWeight: '700',
  },
});
