import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Input } from '@/components/themed/Input';
import { Button } from '@/components/themed/Button';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, CheckCircle } from 'lucide-react-native';
import { colors } from '@/constants/Colors';
import { ROUTES } from '@/constants/Routes';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, loading, error } = useAuth();
  const router = useRouter();

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

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      await login(email, password, rememberMe);
    }
  };
  
  const toggleRememberMe = () => {
    setRememberMe(prev => !prev);
  };

  const navigateToForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={50}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          style={styles.logoContainer}
          entering={FadeInDown.duration(800).delay(200)}
        >
          <Image
            source={require('../../assets/images/indian-railway-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <StyledView style={styles.logoOverlay} backgroundColor="transparent">
            <StyledText size="4xl" weight="bold" color={colors.white} style={styles.logoText}>
              Coach Inspection
            </StyledText>
            <StyledText size="lg" weight="medium" color={colors.white} style={styles.logoSubText}>
              भारतीय रेल
            </StyledText>
          </StyledView>
        </Animated.View>

        <Animated.View 
          style={styles.formContainer}
          entering={FadeInUp.duration(800).delay(400)}
        >
          <StyledText size="2xl" weight="bold" style={styles.title} color={colors.primary[700]}>
            Welcome Back
          </StyledText>
          
          <StyledText size="md" style={styles.subtitle} color={colors.neutral[600]}>
            Sign in to your account to continue with coach inspections
          </StyledText>

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
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={20} color={colors.neutral[500]} />}
            errorMessage={passwordError}
            autoCorrect={false}
          />
          
          <View style={styles.rememberForgotContainer}>
            <TouchableOpacity 
              style={styles.rememberMeContainer} 
              onPress={toggleRememberMe}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxContainer}>
                {rememberMe ? (
                  <StyledView style={styles.checkbox} backgroundColor={colors.primary[500]}>
                    <CheckCircle size={14} color={colors.white} />
                  </StyledView>
                ) : (
                  <StyledView style={styles.checkbox} backgroundColor={colors.neutral[100]} />
                )}
              </View>
              <StyledText size="sm">
                Remember me
              </StyledText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={navigateToForgotPassword}
              style={styles.forgotPasswordContainer}
            >
              <StyledText size="sm" color={colors.primary[500]}>
                Forgot password?
              </StyledText>
            </TouchableOpacity>
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.loginButton}
          />
          
          <View style={styles.signupContainer}>
            <StyledText size="sm">
              Don't have an account?
            </StyledText>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity style={styles.signupButton}>
                <StyledText size="sm" weight="bold" color={colors.primary[500]}>
                  {" "}Sign up
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
  },
  logoContainer: {
    height: 280,
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    height: 280,
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    tintColor: colors.white,
  },
  logoText: {
    // Using the deprecated properties with a comment to explain why
    // These are flagged as deprecated but the TypeScript types don't support textShadow yet
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    // Note: The proper way would be to use textShadow: '1px 1px 5px rgba(0, 0, 0, 0.75)',
    // but this isn't supported in the TypeScript types yet
  },
  logoSubText: {
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
  },
  loginButton: {
    marginTop: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupButton: {
    paddingHorizontal: 4,
  },
});