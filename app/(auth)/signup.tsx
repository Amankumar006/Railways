import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Input } from '@/components/themed/Input';
import { Button } from '@/components/themed/Button';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, Phone, Building } from 'lucide-react-native';
import { colors } from '@/constants/Colors';
import { ROUTES } from '@/constants/Routes';
import { UserRole } from '@/types';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, loading, error } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');

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

  const handleSignup = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      try {
        await signup(email, password, {
          name,
          email,
          role: 'inspector' as UserRole, // Default role
          department,
          phone,
        });
        
        // Note: No need to navigate, AuthContext will handle that upon successful login
      } catch (error) {
        console.error('Signup failed:', error);
      }
    }
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
          style={styles.headerContainer}
          entering={FadeInDown.duration(800).delay(200)}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <StyledText size="md" color={colors.primary[500]}>
              Back
            </StyledText>
          </TouchableOpacity>
          
          <StyledText size="2xl" weight="bold" style={styles.title}>
            Create Account
          </StyledText>
          
          <StyledText size="md" style={styles.subtitle}>
            Sign up to get started
          </StyledText>
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
            loading={loading}
            fullWidth
            size="lg"
            style={styles.signupButton}
          />
          
          <View style={styles.loginContainer}>
            <StyledText size="sm">
              Already have an account?
            </StyledText>
            <Link href={`/(auth)/${ROUTES.AUTH.LOGIN}`} asChild>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
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
});