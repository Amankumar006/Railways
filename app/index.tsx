import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colorScheme, colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';

/**
 * Root index component that handles authentication state and redirects accordingly
 * This is the main entry point of the application
 */
export default function Index() {
  const { isAuthenticated, loading, error } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  // During loading, show a spinner
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // If there's an authentication error, display it
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background, padding: 20 }]}>
        <Text style={{ color: colors.error[500], fontSize: 16, marginBottom: 10, textAlign: 'center' }}>
          {error}
        </Text>
        <Text style={{ color: themeColors.text, fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
          Please try again later or contact support.
        </Text>
        <Redirect href="/(auth)/login" />
      </View>
    );
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
});
