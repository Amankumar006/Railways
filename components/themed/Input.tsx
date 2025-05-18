import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  TextInputProps,
  useColorScheme
} from 'react-native';
import { StyledText } from './StyledText';
import { StyledView } from './StyledView';
import { colorScheme, colors } from '@/constants/Colors';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
}

export function Input({
  label,
  errorMessage,
  leftIcon,
  rightIcon,
  containerStyle,
  secureTextEntry,
  ...otherProps
}: InputProps) {
  const theme = useColorScheme() ?? 'light';
  const themeColors = colorScheme[theme];
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getBorderColor = () => {
    if (errorMessage) return colors.error[500];
    if (isFocused) return colors.primary[500];
    return themeColors.border;
  };

  return (
    <StyledView style={[styles.container, containerStyle]}>
      {label && (
        <StyledText size="sm" style={styles.label}>
          {label}
        </StyledText>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: theme === 'dark' ? colors.neutral[800] : colors.white,
          },
          isFocused && styles.focused,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: themeColors.text,
              paddingLeft: leftIcon ? 8 : 16,
              paddingRight: rightIcon || secureTextEntry ? 8 : 16,
            },
          ]}
          placeholderTextColor={themeColors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...otherProps}
        />

        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.rightIcon} 
            onPress={togglePasswordVisibility}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={themeColors.textSecondary} />
            ) : (
              <Eye size={20} color={themeColors.textSecondary} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {errorMessage ? (
        <StyledText size="xs" style={styles.error} color={colors.error[500]}>
          {errorMessage}
        </StyledText>
      ) : null}
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
  },
  focused: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  leftIcon: {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    marginTop: 4,
  },
});