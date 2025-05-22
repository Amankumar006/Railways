import React from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { StyledView } from './StyledView';
import { StyledText } from './StyledText';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
}

export function Header({
  title,
  subtitle,
  showBackButton = false,
  rightComponent,
  onBackPress,
  backgroundColor,
  textColor,
}: HeaderProps) {
  const { colors, theme } = useTheme();
  const router = useRouter();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };
  
  const bgColor = backgroundColor || theme.brand.primary;
  const txtColor = textColor || theme.brand.white;
  
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={bgColor}
      />
      <StyledView 
        style={styles.container} 
        backgroundColor={bgColor}
      >
        <View style={styles.contentContainer}>
          <View style={styles.leftContainer}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <ChevronLeft size={24} color={txtColor} />
              </TouchableOpacity>
            )}
            
            <View style={styles.titleContainer}>
              <StyledText 
                size="lg" 
                weight="bold" 
                color={txtColor}
                style={styles.title}
              >
                {title}
              </StyledText>
              
              {subtitle && (
                <StyledText 
                  size="sm" 
                  color={txtColor}
                  style={styles.subtitle}
                >
                  {subtitle}
                </StyledText>
              )}
            </View>
          </View>
          
          {rightComponent && (
            <View style={styles.rightContainer}>
              {rightComponent}
            </View>
          )}
        </View>
      </StyledView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    // Using the deprecated properties with a comment to explain why
    // These are flagged as deprecated but the TypeScript types don't support textShadow yet
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    opacity: 0.9,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Header;
