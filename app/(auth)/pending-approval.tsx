import React, { useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Button } from '@/components/themed/Button';
import { colors } from '@/constants/Colors';
import { ROUTES } from '@/constants/Routes';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  // Use effect to clear any URL fragments or params that might cause the error
  useEffect(() => {
    // For web platform, clean up URL to prevent fragment parsing errors
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      try {
        const currentUrl = window.location.href;
        
        // Extra safety checks - verify currentUrl exists before using includes()
        if (typeof currentUrl === 'string') {
          const hasAuthParams = 
            currentUrl.indexOf('#') !== -1 || 
            currentUrl.indexOf('access_token=') !== -1 || 
            currentUrl.indexOf('refresh_token=') !== -1 ||
            currentUrl.indexOf('type=recovery') !== -1;
            
          if (hasAuthParams) {
            // Replace with clean URL (just the path)
            const baseUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, baseUrl);
            console.log('Cleaned URL parameters for safer navigation');
          }
        }
      } catch (error) {
        // Silently catch any URL parsing errors
        console.error('URL parsing error in pending-approval screen:', error);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Handle web platform specifically
      if (Platform.OS === 'web') {
        // First replace the router path to avoid URL parsing issues
        router.replace('/(auth)/login');
        // Then perform logout after a short delay
        setTimeout(async () => {
          await logout();
        }, 100);
      } else {
        // For mobile platforms
        await logout();
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={styles.contentContainer}
        entering={FadeIn.duration(800)}
      >
        <View style={styles.iconContainer}>
          <AlertCircle size={80} color={colors.warning[500]} />
        </View>
        
        <StyledText size="2xl" weight="bold" style={styles.title}>
          Account Pending Approval
        </StyledText>
        
        <StyledText size="md" style={styles.description}>
          Your account has been registered successfully, but requires approval from a manager before you can use the application.
        </StyledText>
        
        <StyledView 
          style={styles.infoContainer} 
          backgroundColor={colors.neutral[50]}
        >
          <StyledText size="sm" style={styles.infoText}>
            A notification has been sent to the managers. You'll receive an email when your account is approved. This process usually takes 1-2 business days.
          </StyledText>
        </StyledView>
        
        <View style={styles.stepContainer}>
          <StyledView style={styles.stepBadge} backgroundColor={colors.success[500]}>
            <CheckCircle2 size={16} color={colors.white} />
          </StyledView>
          <StyledText size="sm" weight="medium">
            Account creation successful
          </StyledText>
        </View>
        
        <View style={styles.stepContainer}>
          <StyledView style={styles.stepBadge} backgroundColor={colors.warning[500]}>
            <AlertCircle size={16} color={colors.white} />
          </StyledView>
          <StyledText size="sm" weight="medium">
            Waiting for manager approval
          </StyledText>
        </View>
        
        <Button
          title="Back to Login"
          onPress={handleLogout}
          fullWidth
          size="lg"
          style={styles.button}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    padding: 24,
  },
  contentContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: colors.neutral[700],
  },
  infoContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  infoText: {
    color: colors.neutral[700],
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  button: {
    marginTop: 32,
  },
});
