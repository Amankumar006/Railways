import { Text, TextProps, StyleSheet, useColorScheme } from 'react-native';
import { colorScheme } from '@/constants/Colors';

export type FontWeight = 'regular' | 'medium' | 'bold';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface StyledTextProps extends TextProps {
  weight?: FontWeight;
  size?: FontSize;
  color?: string;
}

export function StyledText({ 
  weight = 'regular', 
  size = 'md', 
  color,
  style, 
  ...otherProps 
}: StyledTextProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = colorScheme[theme];
  
  return (
    <Text
      style={[
        styles.base,
        styles[weight],
        styles[size],
        { color: color || colors.text },
        style,
      ]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'Inter-Regular',
  },
  regular: {
    fontFamily: 'Inter-Regular',
    fontWeight: 'normal',
  },
  medium: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  bold: {
    fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
  },
  xs: {
    fontSize: 12,
    lineHeight: 16,
  },
  sm: {
    fontSize: 14,
    lineHeight: 20,
  },
  md: {
    fontSize: 16,
    lineHeight: 24,
  },
  lg: {
    fontSize: 18,
    lineHeight: 28,
  },
  xl: {
    fontSize: 20,
    lineHeight: 28,
  },
  '2xl': {
    fontSize: 24,
    lineHeight: 32,
  },
  '3xl': {
    fontSize: 30,
    lineHeight: 36,
  },
  '4xl': {
    fontSize: 36,
    lineHeight: 40,
  },
});