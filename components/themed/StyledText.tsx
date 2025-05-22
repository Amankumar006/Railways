import { Text, TextProps, StyleSheet, useColorScheme, StyleProp, TextStyle } from 'react-native';
import { colorScheme } from '@/constants/Colors';

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface StyledTextProps extends TextProps {
  weight?: FontWeight;
  size?: FontSize;
  color?: string;
  style?: StyleProp<TextStyle>;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
  lineHeight?: number;
}

export function StyledText({ 
  weight = 'regular', 
  size = 'md', 
  color,
  align,
  transform = 'none',
  letterSpacing,
  lineHeight,
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
        align && { textAlign: align },
        transform !== 'none' && { textTransform: transform },
        letterSpacing !== undefined && { letterSpacing },
        lineHeight !== undefined && { lineHeight },
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
  semibold: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  bold: {
    fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
  },
  extrabold: {
    fontFamily: 'Inter-ExtraBold',
    fontWeight: '800',
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