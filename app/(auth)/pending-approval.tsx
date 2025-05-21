import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
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

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
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
