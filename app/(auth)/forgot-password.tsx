import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Input } from '@/components/themed/Input';
import { Button } from '@/components/themed/Button';
import { colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const handleResetPassword = async () => {
    // Clear any previous messages
    setMessage('');
    setError('');
    
    if (!validateEmail(email)) {
      return;
    }
    
    setLoading(true);
    
    try {
      await resetPassword(email);
      setMessage('Password reset instructions sent to your email');
      setEmail(''); // Clear email field after successful submission
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <StyledView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>
      
      <Animated.View 
        style={styles.contentContainer}
        entering={FadeInUp.duration(600)}
      >
        <StyledText size="2xl" weight="bold" style={styles.title}>
          Forgot Password
        </StyledText>
        
        <StyledText size="md" style={styles.subtitle}>
          Enter your email and we'll send you instructions to reset your password
        </StyledText>
        
        {error && (
          <StyledView 
            style={styles.messageContainer} 
            backgroundColor={colors.error[500] + '20'}
          >
            <StyledText size="sm" color={colors.error[500]}>
              {error}
            </StyledText>
          </StyledView>
        )}
        
        {message && (
          <StyledView 
            style={styles.messageContainer} 
            backgroundColor={colors.success[500] + '20'}
          >
            <StyledText size="sm" color={colors.success[500]}>
              {message}
            </StyledText>
          </StyledView>
        )}
        
        <Input
          label="Email"
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Mail size={20} color={colors.neutral[500]} />}
          errorMessage={emailError}
          autoCorrect={false}
        />
        
        <Button
          title="Send Reset Instructions"
          onPress={handleResetPassword}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.resetButton}
        />
        
        <TouchableOpacity 
          style={styles.returnLink}
          onPress={() => router.back()}
        >
          <StyledText size="md" color={colors.primary[500]}>
            Return to Login
          </StyledText>
        </TouchableOpacity>
      </Animated.View>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 24,
  },
  messageContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 12,
  },
  returnLink: {
    marginTop: 24,
    alignItems: 'center',
  },
});