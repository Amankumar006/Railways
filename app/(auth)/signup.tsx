import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Input } from '@/components/themed/Input';
import { Button } from '@/components/themed/Button';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, Phone, Building, Info, AlertCircle } from 'lucide-react-native';
import { colors } from '@/constants/Colors';
import { ROUTES } from '@/constants/Routes';
import { UserRole } from '@/types';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { showError } from '@/utils/errorHandler';
import { logDebug, logError } from '@/utils/logger';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, loading, error, pendingApproval } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Validation functions
  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    } else {
      setNameError('');
      return true;
    }
  };

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

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };

  // Handle pendingApproval state change
  useEffect(() => {
    if (pendingApproval && !loading && !isSubmitting) {
      logDebug('Pending approval detected, navigating to pending approval page');
      router.replace('/(auth)/pending-approval');
    }
  }, [pendingApproval, loading, isSubmitting, router]);

  const handleSignup = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    logDebug('Signup button clicked');
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    logDebug('Validation results:', { isNameValid, isEmailValid, isPasswordValid, isConfirmPasswordValid });

    if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      setIsSubmitting(true);
      try {
        // Create the user data object
        const userData = {
          name,
          email,
          role: 'inspector' as UserRole,
          department: department || undefined,
          phone: phone || undefined,
        };
        
        // Call the signup function from AuthContext
        await signup(email, password, userData);
        
        // Set submitting to false
        setIsSubmitting(false);
        
        // Navigate to pending approval page
        logDebug('Signup successful, redirecting to pending approval page');
        router.replace('/(auth)/pending-approval');
      } catch (error: any) {
        logError('Error in signup process:', error);
        setIsSubmitting(false);
        
        // Use our error handler for cross-platform compatibility
        showError({ 
          title: 'Signup Error',
          message: error.message || 'An unexpected error occurred. Please try again.'
        });
      }
    } else {
      logDebug('Validation failed:', { isNameValid, isEmailValid, isPasswordValid, isConfirmPasswordValid });
      
      // Use our error handler for cross-platform compatibility
      showError({ 
        title: 'Validation Error',
        message: 'Please correct the errors in the form.'
      });
    }
  };

  // Show loading state
  if (loading || isSubmitting) {
    return (
      <StyledView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <StyledText style={{ marginTop: 16 }}>Creating your account...</StyledText>
      </StyledView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { pointerEvents: loading || isSubmitting ? 'none' : 'auto' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={50}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          style={styles.headerImageContainer}
          entering={FadeInDown.duration(800).delay(200)}
        >
          <Image
            source={require('../../assets/images/indian-railway-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <StyledView style={styles.logoOverlay} backgroundColor="transparent">
            <StyledText size="3xl" weight="bold" color={colors.white} style={styles.logoText}>
              Create Account
            </StyledText>
            <StyledText size="md" weight="medium" color={colors.white} style={styles.logoSubText}>
              भारतीय रेल - Indian Railways
            </StyledText>
          </StyledView>
        </Animated.View>

        <Animated.View 
          style={styles.headerContainer}
          entering={FadeInDown.duration(800).delay(300)}
        >
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backButton}>
              <StyledText size="md" color={colors.primary[600]}>
                ← Back to Login
              </StyledText>
            </TouchableOpacity>
          </Link>

          <StyledText size="xl" weight="bold" style={styles.title} color={colors.primary[700]}>
            Join Indian Railways
          </StyledText>
          
          <StyledText size="md" style={styles.subtitle} color={colors.neutral[600]}>
            Sign up to start inspecting coaches
          </StyledText>

          <StyledView 
            style={[styles.infoContainer, { borderColor: colors.secondary[300] }]} 
            backgroundColor={colors.secondary[50]}
          >
            <View style={styles.infoIconContainer}>
              <Info size={20} color={colors.secondary[500]} />
            </View>
            <StyledText size="sm" style={styles.infoText} color={colors.secondary[700]}>
              After signing up, your account will require approval from a manager before you can use the app.
            </StyledText>
          </StyledView>
        </Animated.View>

        <Animated.View 
          style={styles.formContainer}
          entering={FadeInUp.duration(800).delay(300)}
        >
          {error && (
            <StyledView 
              style={styles.errorContainer} 
              backgroundColor={colors.error[500] + '20'}
            >
              <StyledText size="sm" color={colors.error[500]}>
                {error}
              </StyledText>
            </StyledView>
          )}

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            leftIcon={<User size={20} color={colors.neutral[500]} />}
            errorMessage={nameError}
            autoCorrect={false}
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={colors.neutral[500]} />}
            errorMessage={emailError}
            autoCorrect={false}
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={20} color={colors.neutral[500]} />}
            errorMessage={passwordError}
            autoCorrect={false}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon={<Lock size={20} color={colors.neutral[500]} />}
            errorMessage={confirmPasswordError}
            autoCorrect={false}
          />

          <Input
            label="Department (Optional)"
            placeholder="Your department"
            value={department}
            onChangeText={setDepartment}
            leftIcon={<Building size={20} color={colors.neutral[500]} />}
            autoCorrect={false}
          />

          <Input
            label="Phone (Optional)"
            placeholder="Your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={colors.neutral[500]} />}
            autoCorrect={false}
          />

          <Button
            title="Sign Up"
            onPress={handleSignup}
            loading={loading || isSubmitting}
            fullWidth
            size="lg"
            style={styles.signupButton}
            disabled={loading || isSubmitting}
          />
          
          <View style={styles.loginContainer}>
            <StyledText size="sm">
              Already have an account?
            </StyledText>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.loginLink}>
                <StyledText size="sm" weight="bold" color={colors.primary[500]}>
                  {" "}Sign in
                </StyledText>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerImageContainer: {
    height: 220,
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    height: 220,
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 12,
    tintColor: colors.white,
  },
  logoText: {
    // @ts-ignore - textShadow properties work but TypeScript types are outdated
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  logoSubText: {
    marginTop: 4,
    // @ts-ignore - textShadow properties work but TypeScript types are outdated
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary[500],
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  infoIconContainer: {
    marginRight: 10,
  },
  infoText: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  signupButton: {
    marginTop: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginLink: {
    paddingHorizontal: 4,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});