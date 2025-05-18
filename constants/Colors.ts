export const colors = {
  primary: {
    50: '#E0F2FF',
    100: '#B8E2FF',
    200: '#8BCEFF',
    300: '#59B9FF',
    400: '#34A6FF',
    500: '#0A84FF', // Main primary color
    600: '#0073E6',
    700: '#0058B3',
    800: '#003D80',
    900: '#002952',
  },
  secondary: {
    50: '#FFF0E0',
    100: '#FFE0B8',
    200: '#FFCF8B',
    300: '#FFBC59',
    400: '#FFAC34',
    500: '#FF9500', // Main secondary color
    600: '#E67F00',
    700: '#B36200',
    800: '#804600',
    900: '#523000',
  },
  success: {
    50: '#E5FAE9',
    100: '#C3F4CD',
    200: '#9FEDB1',
    300: '#70E48C',
    400: '#4FDA6C',
    500: '#30D158', // Main success color
    600: '#26B94A',
    700: '#1C9239',
    800: '#146B2A',
    900: '#0C4419',
  },
  warning: {
    50: '#FFFCE0',
    100: '#FFF8B8',
    200: '#FFF28B',
    300: '#FFEB59',
    400: '#FFE334',
    500: '#FFD60A', // Main warning color
    600: '#E6BE00',
    700: '#B39200',
    800: '#806800',
    900: '#524300',
  },
  error: {
    50: '#FFE5E5',
    100: '#FFC3C3',
    200: '#FF9E9E',
    300: '#FF7878',
    400: '#FF5B5B',
    500: '#FF453A', // Main error color
    600: '#E63930',
    700: '#B32D26',
    800: '#80201C',
    900: '#521411',
  },
  neutral: {
    50: '#F9F9F9',
    100: '#F2F2F2',
    200: '#E6E6E6',
    300: '#D6D6D6',
    400: '#B8B8B8',
    500: '#8C8C8C',
    600: '#666666',
    700: '#444444',
    800: '#222222',
    900: '#111111',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const colorScheme = {
  light: {
    background: colors.white,
    text: colors.neutral[800],
    textSecondary: colors.neutral[600],
    card: colors.white,
    border: colors.neutral[200],
    notification: colors.primary[500],
    tabBarActiveIcon: colors.primary[500],
    tabBarIcon: colors.neutral[500],
    statusBar: 'dark',
  },
  dark: {
    background: colors.neutral[900],
    text: colors.neutral[100],
    textSecondary: colors.neutral[400],
    card: colors.neutral[800],
    border: colors.neutral[700],
    notification: colors.primary[400],
    tabBarActiveIcon: colors.primary[400],
    tabBarIcon: colors.neutral[400],
    statusBar: 'light',
  },
};

export default { colors, colorScheme };