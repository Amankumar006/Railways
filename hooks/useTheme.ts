import { useColorScheme } from 'react-native';
import { colors, colorScheme } from '@/constants/Colors';
import theme from '@/constants/Theme';

/**
 * Custom hook to provide theme values based on the current color scheme
 * Incorporates Indian Railways theme colors and styling
 */
export function useTheme() {
  const colorMode = useColorScheme() ?? 'light';
  const currentColorScheme = colorScheme[colorMode];
  
  return {
    colorMode,
    colors: {
      ...colors,
      ...currentColorScheme,
    },
    theme,
    isDark: colorMode === 'dark',
    isLight: colorMode === 'light',
  };
}

export default useTheme;
