import { colors } from './Colors';

/**
 * Theme configuration for the Indian Railways Coach Inspection application
 */
export const theme = {
  // Brand colors
  brand: {
    primary: colors.primary[500], // Indian Railways Blue
    secondary: colors.secondary[500], // Saffron (from Indian flag)
    success: colors.success[500], // Green (from Indian flag)
    white: colors.white,
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semibold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
      extrabold: 'Inter-ExtraBold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 28,
      '2xl': 32,
      '3xl': 36,
      '4xl': 40,
    },
  },
  
  // Spacing
  spacing: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  // Border radius
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  // Animation durations
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  // Indian Railways specific design elements
  indianRailways: {
    // Colors from the Indian Railways logo and branding
    blue: colors.primary[500], // Main IR blue
    lightBlue: colors.primary[300],
    darkBlue: colors.primary[700],
    
    // Colors from the Indian flag
    saffron: colors.secondary[500], // Top band of Indian flag
    white: colors.white, // Middle band of Indian flag
    green: colors.success[500], // Bottom band of Indian flag
    
    // Accent colors commonly used in Indian Railways
    red: colors.error[500], // Used for warnings and important notices
    yellow: colors.warning[500], // Used for caution indicators
  },
};

export default theme;
