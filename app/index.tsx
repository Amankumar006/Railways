import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, StyleSheet, Image } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { StyledText, StyledView } from '../components/themed';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LoadingTrain } from '@/components/LoadingTrain';

/**
 * Root index component that handles authentication state and redirects accordingly
 * This is the main entry point of the application
 */
export default function Index() {
  const { isAuthenticated, loading, error, pendingApproval } = useAuth();
  const { colors, theme } = useTheme();
  
  // During loading, show a branded loading screen
  if (loading) {
    return (
      <StyledView style={styles.container} backgroundColor={theme.indianRailways.blue}>
        <Animated.View entering={FadeIn.duration(800)} style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/ir-logo.png')} 
            style={[styles.logo]}
            resizeMode="contain"
          />
          <StyledText 
            size="2xl" 
            weight="bold" 
            color={colors.white} 
            style={styles.appTitle}
          >
            Coach Inspection
          </StyledText>
          <StyledText 
            size="md" 
            weight="medium" 
            color={colors.white} 
            style={styles.appSubtitle}
          >
            भारतीय रेल
          </StyledText>
          <LoadingTrain />
        </Animated.View>
      </StyledView>
    );
  }

  // If there's an authentication error, display it
  if (error) {
    return (
      <StyledView style={styles.container} padding="lg">
        <Image 
          source={require('../assets/images/ir-logo.png')} 
          style={[styles.logo, { tintColor: theme.indianRailways.red, opacity: 0.8 }]}
        />
        <StyledText 
          size="lg" 
          weight="bold" 
          color={theme.indianRailways.red} 
          style={styles.errorTitle}
        >
          Authentication Error
        </StyledText>
        <StyledText 
          size="md" 
          color={colors.error[500]}
          style={styles.errorMessage}
          align="center"
        >
          {error}
        </StyledText>
        <StyledText 
          size="sm" 
          color={colors.textSecondary}
          style={styles.errorHelp}
          align="center"
        >
          Please try again later or contact Indian Railways support.
        </StyledText>
        <Redirect href="/(auth)/login" />
      </StyledView>
    );
  }
  
  // Handle pending approval state
  if (pendingApproval) {
    return <Redirect href="/(auth)/pending-approval" />;
  }
  
  // Redirect based on authentication status
  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    tintColor: 'white',
  },
  appTitle: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  appSubtitle: {
    marginTop: 8,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    marginBottom: 16,
    maxWidth: 300,
  },
  errorHelp: {
    maxWidth: 300,
  },
});
