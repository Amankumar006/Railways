import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle,
  useColorScheme
} from 'react-native';
import { StyledText } from './StyledText';
import { colors, colorScheme } from '@/constants/Colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const theme = useColorScheme() ?? 'light';
  const themeColors = colorScheme[theme];
  
  // Determine button styles based on variant and disabled state
  const getButtonStyle = (): ViewStyle => {
    if (disabled) {
      return {
        ...styles.button,
        ...styles[`button-${size}`],
        backgroundColor: themeColors.border,
        borderColor: themeColors.border,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...styles.button,
          ...styles[`button-${size}`],
          backgroundColor: colors.primary[500],
          borderColor: colors.primary[600],
          borderWidth: 1,
          // Add a subtle shadow for depth
          shadowColor: colors.primary[900],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 3,
        };
      case 'secondary':
        return {
          ...styles.button,
          ...styles[`button-${size}`],
          backgroundColor: colors.secondary[500],
          borderColor: colors.secondary[600],
          borderWidth: 1,
          // Add a subtle shadow for depth
          shadowColor: colors.secondary[900],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 3,
        };
      case 'outline':
        return {
          ...styles.button,
          ...styles[`button-${size}`],
          backgroundColor: 'transparent',
          borderColor: colors.primary[500],
          borderWidth: 1,
        };
      case 'ghost':
        return {
          ...styles.button,
          ...styles[`button-${size}`],
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return styles.button;
    }
  };

  // Determine text color based on variant and disabled state
  const getTextColor = (): string => {
    if (disabled) {
      return themeColors.textSecondary;
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.white;
      case 'outline':
      case 'ghost':
        return colors.primary[500];
      default:
        return colors.white;
    }
  };

  // Render content with or without loading indicator
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
        />
      );
    }

    // Helper function to handle conditional styles safely
    const getIconSpacing = () => {
      if (icon) {
        if (iconPosition === 'left') {
          return { marginLeft: 8 };
        } else if (iconPosition === 'right') {
          return { marginRight: 8 };
        }
      }
      return {};
    };

    return (
      <>
        {icon && iconPosition === 'left' && icon}
        {title && <StyledText
          style={[
            styles.text,
            styles[`text-${size}`],
            { color: getTextColor() },
            getIconSpacing(),
            textStyle,
          ]}
          weight={variant === 'ghost' ? 'medium' : 'bold'}
        >
          {title}
        </StyledText>}
        {icon && iconPosition === 'right' && icon}
      </>
    );
  };

  // Handle the button press with console logging for debugging
  const handlePress = () => {
    console.log('Button pressed:', title);
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    // Add a subtle gradient effect with border
    overflow: 'hidden',
  },
  'button-sm': {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  'button-md': {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  'button-lg': {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  text: {
    textAlign: 'center',
  },
  'text-sm': {
    fontSize: 14,
  },
  'text-md': {
    fontSize: 16,
  },
  'text-lg': {
    fontSize: 18,
  },
  fullWidth: {
    width: '100%',
  },
});