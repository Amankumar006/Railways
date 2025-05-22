import { View, ViewProps, StyleSheet, useColorScheme } from 'react-native';
import { colorScheme } from '@/constants/Colors';

interface StyledViewProps extends ViewProps {
  backgroundColor?: string;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'full';
  elevation?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  border?: boolean;
  borderColor?: string;
}

export function StyledView({ 
  backgroundColor,
  padding = 'none',
  margin = 'none',
  rounded = 'none',
  elevation = 'none',
  border = false,
  borderColor,
  style, 
  ...otherProps 
}: StyledViewProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = colorScheme[theme];
  
  // Generate shadow styles based on elevation
  const getShadowStyle = () => {
    if (elevation === 'none') return {};
    
    const elevationValues = {
      'xs': { height: 1, opacity: 0.1, radius: 2 },
      'sm': { height: 2, opacity: 0.15, radius: 3 },
      'md': { height: 3, opacity: 0.2, radius: 5 },
      'lg': { height: 4, opacity: 0.25, radius: 8 },
    };
    
    const value = elevationValues[elevation];
    
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: value.height },
      shadowOpacity: value.opacity,
      shadowRadius: value.radius,
      elevation: value.height * 2,
    };
  };
  
  return (
    <View
      style={[
        { backgroundColor: backgroundColor || colors.background },
        padding !== 'none' && styles[`padding-${padding}`],
        margin !== 'none' && styles[`margin-${margin}`],
        rounded !== 'none' && styles[`rounded-${rounded}`],
        elevation !== 'none' && getShadowStyle(),
        border && { borderWidth: 1, borderColor: borderColor || colors.border },
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
  
  'rounded-xs': { borderRadius: 2 },
  'rounded-sm': { borderRadius: 4 },
  'rounded-md': { borderRadius: 8 },
  'rounded-lg': { borderRadius: 12 },
  'rounded-full': { borderRadius: 9999 },
});