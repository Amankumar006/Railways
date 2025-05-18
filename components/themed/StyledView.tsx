import { View, ViewProps, StyleSheet, useColorScheme } from 'react-native';
import { colorScheme } from '@/constants/Colors';

interface StyledViewProps extends ViewProps {
  backgroundColor?: string;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function StyledView({ 
  backgroundColor,
  padding = 'none',
  margin = 'none',
  style, 
  ...otherProps 
}: StyledViewProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = colorScheme[theme];
  
  return (
    <View
      style={[
        { backgroundColor: backgroundColor || colors.background },
        padding !== 'none' && styles[`padding-${padding}`],
        margin !== 'none' && styles[`margin-${margin}`],
        style,
      ]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  'padding-xs': { padding: 4 },
  'padding-sm': { padding: 8 },
  'padding-md': { padding: 16 },
  'padding-lg': { padding: 24 },
  'padding-xl': { padding: 32 },
  
  'margin-xs': { margin: 4 },
  'margin-sm': { margin: 8 },
  'margin-md': { margin: 16 },
  'margin-lg': { margin: 24 },
  'margin-xl': { margin: 32 },
});