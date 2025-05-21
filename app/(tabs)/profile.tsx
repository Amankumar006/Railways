import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal
} from 'react-native';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Card } from '@/components/themed/Card';
import { Button } from '@/components/themed/Button';
import { Input } from '@/components/themed/Input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { colorScheme, colors } from '@/constants/Colors';
import { 
  User, Mail, Phone, Building, Shield, LogOut, 
  Moon, Sun, CircleHelp as HelpCircle, Bell, 
  Settings, FileText, Camera, Edit, X, RefreshCw, 
  WifiOff, Calendar, Archive, BarChart, Award, Lock
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Use the existing colors object which now includes info colors
const extendedColors = {
  ...colors
};

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  // Extra security check - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'settings'>('profile');
  
  // Modal states
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [isBiometricsModalVisible, setIsBiometricsModalVisible] = useState(false);

  // Form states
  const [userProfile, setUserProfile] = useState<{
    avatar_url?: string;
    phone?: string;
    department?: string;
    join_date?: string;
    employee_id?: string;
    bio?: string;
  } | null>(null);

  const [editableProfile, setEditableProfile] = useState({
    name: user?.name || '',
    phone: '',
    department: '',
    bio: '',
    employee_id: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Stats state
  const [userStats, setUserStats] = useState({
    completedInspections: 0,
    completionRate: 0,
    pendingInspections: 0,
    inProgressInspections: 0,
    canceledInspections: 0,
    totalInspections: 0,
    lastCompletedDate: null as string | null,
    onTimeCompletion: 0,
    averageInspectionTime: 0, // New metric
    topCoachType: '', // New metric
    recentActivity: [] as Array<{ id: string, action: string, date: string, type: string }>
  });

  // Fetch user statistics from Supabase
  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setError(null);
    
    try {
      // Get user profile with avatar - use maybeSingle() instead of single()
      // maybeSingle() returns null for data when no rows are found instead of throwing an error
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Continue with default values even if profile fetch fails
      }
      
      // Set default profile data regardless of whether we found a profile or not
      // This ensures we always have valid data to display
      const defaultProfileData = {
        name: user.name || 'New User',
        phone: '',
        department: '',
        bio: '',
        employee_id: '',
        avatar_url: null,
        role: user.role || 'inspector',
        approval_status: 'approved'
      };
      
      // Use profile data if it exists, otherwise use defaults
      const finalProfileData = profileData || defaultProfileData;
      
      setUserProfile(finalProfileData);
      setEditableProfile({
        name: user.name || finalProfileData.name || '',
        phone: finalProfileData.phone || '',
        department: finalProfileData.department || '',
        bio: finalProfileData.bio || '',
        employee_id: finalProfileData.employee_id || '',
      });
      
      // Fetch enhanced inspection statistics
      let completedCount = 0;
      let totalCount = 0;
      let pendingCount = 0;
      let inProgressCount = 0;
      let canceledCount = 0;
      let lastCompletedDate: string | null = null;
      let onTimeCount = 0;
      let totalCompletionTime = 0;
      let coachTypeCount: Record<string, number> = {};
      let recentActivities: Array<{ id: string, action: string, date: string, type: string }> = [];
      
      // Get inspections with related coach data
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('schedules')
        .select(`
          id, 
          status, 
          scheduled_date, 
          completed_date,
          created_at,
          coach:coaches(type)
        `)
        .eq('assigned_to_id', user.id)
        .order('created_at', { ascending: false });
        
      if (inspectionsError) throw inspectionsError;
      
      if (inspectionsData) {
        totalCount = inspectionsData.length;
        
        // Process each inspection
        const now = new Date();
        
        inspectionsData.forEach((inspection, index) => {
          // Count by coach type for top coach type metric
          if (inspection.coach && inspection.coach[0]?.type) {
            if (!coachTypeCount[inspection.coach[0].type]) {
              coachTypeCount[inspection.coach[0].type] = 0;
            }
            coachTypeCount[inspection.coach[0].type]++;
          }
          
          // Add to recent activity if this is one of the 10 most recent
          if (index < 10) {
            recentActivities.push({
              id: inspection.id,
              action: `Inspection ${inspection.status}`,
              date: inspection.completed_date || inspection.scheduled_date,
              type: inspection.status
            });
          }
          
          switch(inspection.status) {
            case 'completed':
              completedCount++;
              
              // Track the latest completed date
              const completedDate = inspection.completed_date ? new Date(inspection.completed_date) : null;
              if (completedDate && (!lastCompletedDate || completedDate > (lastCompletedDate ? new Date(lastCompletedDate) : new Date(0)))) {
                lastCompletedDate = inspection.completed_date;
              }
              
              // Check if completed on time (before or on scheduled date)
              const scheduledDate = new Date(inspection.scheduled_date);
              if (completedDate && completedDate <= scheduledDate) {
                onTimeCount++;
              }
              
              // Calculate completion time for average metric
              if (completedDate && inspection.created_at) {
                const createdDate = new Date(inspection.created_at);
                const timeDiff = completedDate.getTime() - createdDate.getTime();
                const daysDiff = timeDiff / (1000 * 3600 * 24);
                totalCompletionTime += daysDiff;
              }
              break;
            case 'pending':
              pendingCount++;
              break;
            case 'in-progress':
              inProgressCount++;
              break;
            case 'canceled':
              canceledCount++;
              break;
          }
        });
      }
      
      // Calculate metrics
      const completionRate = totalCount > 0 
        ? Math.round((completedCount / totalCount) * 100) 
        : 0;
        
      const onTimeRate = completedCount > 0
        ? Math.round((onTimeCount / completedCount) * 100)
        : 0;
        
      const avgCompletionTime = completedCount > 0
        ? Math.round((totalCompletionTime / completedCount) * 10) / 10 // Round to 1 decimal place
        : 0;
        
      // Find top coach type
      let topCoachType = '';
      let maxCount = 0;
      Object.entries(coachTypeCount).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topCoachType = type;
        }
      });
      
      setUserStats({
        completedInspections: completedCount || 0,
        completionRate,
        pendingInspections: pendingCount || 0,
        inProgressInspections: inProgressCount || 0,
        canceledInspections: canceledCount || 0,
        totalInspections: totalCount || 0,
        lastCompletedDate,
        onTimeCompletion: onTimeRate,
        averageInspectionTime: avgCompletionTime,
        topCoachType,
        recentActivity: recentActivities
      });
      
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      setError(error.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.name]);
  
  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);
  
  // Fetch data on initial load
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  // Check for network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!(state.isConnected && state.isInternetReachable));
      
      // If we're back online and have pending changes, sync them
      if (state.isConnected && state.isInternetReachable) {
        if (pendingChanges) {
          syncOfflineChanges();
        }
        
        // Check for pending avatar uploads
        syncPendingAvatarUploads();
      }
    });
    
    // Check for any pending changes in storage
    checkPendingChanges();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Check if we have any pending profile changes
  const checkPendingChanges = async () => {
    try {
      const pendingProfileChanges = await AsyncStorage.getItem('pending_profile_changes');
      const pendingAvatarUpload = await AsyncStorage.getItem('pending_avatar_upload');
      
      if (pendingProfileChanges || pendingAvatarUpload) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('Error checking pending changes:', error);
    }
  };
  
  // Sync any offline changes when back online
  const syncOfflineChanges = async () => {
    if (!user?.id) return;
    
    setSyncingData(true);
    try {
      const pendingProfileChanges = await AsyncStorage.getItem('pending_profile_changes');
      if (pendingProfileChanges) {
        const profileChanges = JSON.parse(pendingProfileChanges);
        
        // Upload to Supabase
        const { error } = await supabase
          .from('profiles')
          .update(profileChanges)
          .eq('id', user.id);
        
        if (error) throw error;
        
        // Clear the pending changes
        await AsyncStorage.removeItem('pending_profile_changes');
        
        // Update the local state
        setUserProfile(prev => ({
          ...prev,
          ...profileChanges
        }));
        
        console.log('Offline profile changes synced successfully');
      }
      
      // Check pending avatar changes separately
      await syncPendingAvatarUploads();
      
      // Update pendingChanges state
      const stillHasPendingChanges = 
        await AsyncStorage.getItem('pending_profile_changes') || 
        await AsyncStorage.getItem('pending_avatar_upload');
        
      setPendingChanges(!!stillHasPendingChanges);
      
    } catch (error) {
      console.error('Error syncing offline changes:', error);
    } finally {
      setSyncingData(false);
    }
  };
  
  // Sync pending avatar uploads
  const syncPendingAvatarUploads = async () => {
    if (!user?.id) return;
    
    try {
      const pendingAvatarUpload = await AsyncStorage.getItem('pending_avatar_upload');
      if (pendingAvatarUpload) {
        const { uri, base64 } = JSON.parse(pendingAvatarUpload);
        
        // Try to upload the image now
        const result = await uploadImageToSupabase(uri, base64);
        if (result.success) {
          // Remove from pending storage
          await AsyncStorage.removeItem('pending_avatar_upload');
          console.log('Pending avatar upload synced successfully');
        }
      }
    } catch (error) {
      console.error('Error syncing avatar upload:', error);
    }
  };
  
  // Upload image to Supabase Storage
  const uploadImageToSupabase = async (uri: string, base64: string | undefined) => {
    if (!user?.id || !base64) {
      return { success: false, error: 'Invalid image data' };
    }
    
    try {
      // Generate a unique file path
      const filePath = `${user.id}/${Date.now()}.jpg`;
      
      // Convert base64 to ArrayBuffer
      const contentArrayBuffer = decode(base64);
      
      // Upload the image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, contentArrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL for the uploaded image
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (!data?.publicUrl) {
        throw new Error('Could not get public URL for uploaded image');
      }
      
      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        avatar_url: data.publicUrl
      }));
      
      return { success: true, avatarUrl: data.publicUrl };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  };
  
  // Upload image with offline support
  const uploadImage = async (uri: string, base64: string | undefined) => {
    if (!user?.id || !base64) {
      Alert.alert('Error', 'Could not upload image');
      return;
    }
    
    setUploadingImage(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (isOffline) {
        // Store for later upload
        await AsyncStorage.setItem('pending_avatar_upload', JSON.stringify({ uri, base64 }));
        setPendingChanges(true);
        
        // Update UI with temporary local image
        setUserProfile(prev => ({
          ...prev,
          avatar_url: uri  // Use local URI for now
        }));
        
        Alert.alert('Saved Offline', 'Your profile picture will be uploaded when you\'re back online.');
      } else {
        // Online upload
        const result = await uploadImageToSupabase(uri, base64);
        
        if (result.success) {
          Alert.alert('Success', 'Profile picture updated successfully');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error: any) {
      console.error('Error handling image upload:', error);
      Alert.alert('Upload Failed', error.message || 'Could not upload image');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Image picker function
  const pickImage = async () => {
    try {
      // Ask for permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a profile picture.'
        );
        return;
      }
      
      // Show action sheet for photo options
      Alert.alert(
        'Change Profile Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: chooseFromLibrary },
          { text: 'Remove Photo', onPress: removePhoto, style: 'destructive' },
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Could not access the photo library');
    }
  };
  
  // Take a photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        
        if (uri && base64) {
          await uploadImage(uri, base64);
        } else {
          Alert.alert('Error', 'Could not get image data');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo');
    }
  };
  
  // Choose from library
  const chooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        
        if (uri && base64) {
          await uploadImage(uri, base64);
        } else {
          Alert.alert('Error', 'Could not get image data');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };
  
  // Remove profile photo
  const removePhoto = async () => {
    if (!user?.id) return;
    
    try {
      if (isOffline) {
        Alert.alert('Offline', 'You need to be online to remove your profile photo');
        return;
      }
      
      setUploadingImage(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setUserProfile(prev => ({
        ...prev,
        avatar_url: undefined
      }));
      
      Alert.alert('Success', 'Profile photo removed');
    } catch (error: any) {
      console.error('Error removing photo:', error);
      Alert.alert('Error', error.message || 'Could not remove profile photo');
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Handle profile updates
  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const updates = {
        name: editableProfile.name,
        phone: editableProfile.phone,
        department: editableProfile.department,
        bio: editableProfile.bio,
        employee_id: editableProfile.employee_id,
      };
      
      if (isOffline) {
        // Store changes locally
        await AsyncStorage.setItem('pending_profile_changes', JSON.stringify(updates));
        setPendingChanges(true);
        
        // Update local state immediately
        setUserProfile(prev => ({
          ...prev,
          phone: updates.phone,
          department: updates.department,
          bio: updates.bio,
          employee_id: updates.employee_id
        }));
        
        Alert.alert('Saved Offline', 'Your profile changes will be synced when you\'re back online.');
      } else {
        // Online mode - update directly
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        
        if (error) throw error;
        
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          phone: updates.phone,
          department: updates.department,
          bio: updates.bio,
          employee_id: updates.employee_id
        }));
        
        Alert.alert('Success', 'Profile updated successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setIsEditProfileModalVisible(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async () => {
    // Reset error state
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    let isValid = true;
    
    // Validate current password
    if (!passwordForm.currentPassword) {
      setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is required' }));
      isValid = false;
    }
    
    // Validate new password
    if (!passwordForm.newPassword) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'New password is required' }));
      isValid = false;
    } else if (passwordForm.newPassword.length < 6) {
      setPasswordErrors(prev => ({ ...prev, newPassword: 'Password must be at least 6 characters' }));
      isValid = false;
    }
    
    // Validate password confirmation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      isValid = false;
    }
    
    if (!isValid) return;
    
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Change password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      
      if (error) throw error;
      
      // Reset form and close modal
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setIsChangePasswordModalVisible(false);
      Alert.alert('Success', 'Password changed successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              console.log('Logout successful');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Logout Failed', 'Please try again');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  // User info items for display
  const userInfo = [
    {
      icon: <Mail size={20} color={colors.primary[500]} />,
      label: 'Email',
      value: user?.email || '',
    },
    {
      icon: <Phone size={20} color={colors.primary[500]} />,
      label: 'Phone',
      value: userProfile?.phone || 'Not provided',
    },
    {
      icon: <Building size={20} color={colors.primary[500]} />,
      label: 'Department',
      value: userProfile?.department || 'Not assigned',
    },
    {
      icon: <Shield size={20} color={colors.primary[500]} />,
      label: 'Role',
      value: user?.role || 'User',
    },
    {
      icon: <Archive size={20} color={colors.primary[500]} />,
      label: 'Employee ID',
      value: userProfile?.employee_id || 'Not assigned',
    },
  ];
  
  // Menu items for settings
  const menuItems = [
    {
      icon: <Edit size={20} color={colors.secondary[500]} />,
      title: 'Edit Profile',
      onPress: () => setIsEditProfileModalVisible(true),
    },
    {
      icon: <Lock size={20} color={colors.secondary[500]} />,
      title: 'Change Password',
      onPress: () => setIsChangePasswordModalVisible(true),
    },
    ...(user?.role === 'manager' ? [{
      icon: <Shield size={20} color={colors.secondary[500]} />,
      title: 'Admin Dashboard',
      onPress: () => router.push('/admin'),
    }] : []),
    {
      icon: <FileText size={20} color={colors.secondary[500]} />,
      title: 'Documentation',
      onPress: () => console.log('Documentation'),
    },
    {
      icon: <HelpCircle size={20} color={colors.secondary[500]} />,
      title: 'Help & Support',
      onPress: () => console.log('Help & Support'),
    },
    {
      icon: <LogOut size={20} color={extendedColors.error[500]} />,
      title: 'Logout',
      onPress: handleLogout,
    },
  ];
  
  // Get avatar URL with fallback
  const avatarUrl = userProfile?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  
  // Fixed loading condition
  if (loading && !refreshing) {
    return (
      <StyledView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <StyledText style={{ marginTop: 16 }}>Loading profile...</StyledText>
      </StyledView>
    );
  }
  
  // Show error state if there was an error
  if (error && !refreshing) {
    return (
      <StyledView style={[styles.container, styles.errorContainer]}>
        <StyledText style={styles.errorText}>Error loading profile</StyledText>
        <StyledText style={styles.errorSubText}>{error}</StyledText>
        <Button
          title="Try Again"
          onPress={() => {
            setLoading(true);
            fetchUserData();
          }}
          style={{ marginTop: 20 }}
        />
      </StyledView>
    );
  }
  
  // Render profile UI
  return (
    <StyledView style={styles.container}>
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color={colors.white} />
          <StyledText size="sm" color={colors.white} style={{ marginLeft: 8 }}>
            You are offline
          </StyledText>
        </View>
      )}
      
      {/* Sync Banner */}
      {pendingChanges && !isOffline && (
        <TouchableOpacity 
          style={styles.syncBanner}
          onPress={syncOfflineChanges}
          disabled={syncingData}
        >
          {syncingData ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <RefreshCw size={16} color={colors.white} />
          )}
          <StyledText size="sm" color={colors.white} style={{ marginLeft: 8 }}>
            {syncingData ? 'Syncing changes...' : 'Tap to sync pending changes'}
          </StyledText>
        </TouchableOpacity>
      )}
      
      {/* Main content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          (isOffline || pendingChanges) && { paddingTop: 40 }
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <StyledText size="2xl" weight="bold">
            Profile
          </StyledText>
        </View>
        
        {/* Profile Card */}
        <Animated.View entering={FadeIn.duration(600).delay(200)}>
          <Card style={styles.profileCard} elevation="md">
            <View style={styles.profileHeader}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator size="small" color={colors.white} />
                  </View>
                ) : (
                  <>
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatar}
                    />
                    <View style={styles.avatarOverlay}>
                      <Camera size={20} color={colors.white} />
                    </View>
                  </>
                )}
              </TouchableOpacity>
              
              <View style={styles.profileInfo}>
                <StyledText size="xl" weight="bold">
                  {user?.name || 'User'}
                </StyledText>
                
                <View style={styles.badgeContainer}>
                  <View style={[
                    styles.roleBadge, 
                    { 
                      backgroundColor: user?.role === 'manager' 
                        ? colors.secondary[500] + '20' 
                        : colors.primary[500] + '20' // Default to inspector color
                    }
                  ]}>
                    <StyledText 
                      size="xs" 
                      weight="medium" 
                      color={
                        user?.role === 'manager' 
                          ? colors.secondary[500] 
                          : colors.primary[500] // Default to inspector color
                      }
                    >
                      {user?.role?.toUpperCase() || 'USER'}
                    </StyledText>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Bio section */}
            {userProfile?.bio && (
              <View style={styles.bioContainer}>
                <StyledText size="sm" style={styles.bioText}>
                  {userProfile.bio}
                </StyledText>
              </View>
            )}
            
            {/* User stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <StyledText size="2xl" weight="bold" color={colors.primary[500]}>
                  {userStats.completedInspections}
                </StyledText>
                <StyledText size="xs" color={colors.neutral[500]}>
                  Completed
                </StyledText>
              </View>
              
              <View style={styles.statItem}>
                <StyledText size="2xl" weight="bold" color={colors.primary[500]}>
                  {userStats.pendingInspections}
                </StyledText>
                <StyledText size="xs" color={colors.neutral[500]}>
                  Pending
                </StyledText>
              </View>
              
              <View style={styles.statItem}>
                <StyledText size="2xl" weight="bold" color={colors.primary[500]}>
                  {userStats.completionRate}%
                </StyledText>
                <StyledText size="xs" color={colors.neutral[500]}>
                  Completion
                </StyledText>
              </View>
            </View>
          </Card>
        </Animated.View>
        
        {/* Tab navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'profile' && styles.activeTabButton]}
            onPress={() => setActiveTab('profile')}
          >
            <StyledText 
              size="sm" 
              weight={activeTab === 'profile' ? 'bold' : 'regular'}
              color={activeTab === 'profile' ? colors.primary[500] : colors.neutral[500]}
            >
              Profile
            </StyledText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'activity' && styles.activeTabButton]}
            onPress={() => setActiveTab('activity')}
          >
            <StyledText 
              size="sm" 
              weight={activeTab === 'activity' ? 'bold' : 'regular'}
              color={activeTab === 'activity' ? colors.primary[500] : colors.neutral[500]}
            >
              Activity
            </StyledText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'settings' && styles.activeTabButton]}
            onPress={() => setActiveTab('settings')}
          >
            <StyledText 
              size="sm" 
              weight={activeTab === 'settings' ? 'bold' : 'regular'}
              color={activeTab === 'settings' ? colors.primary[500] : colors.neutral[500]}
            >
              Settings
            </StyledText>
          </TouchableOpacity>
        </View>
        
        {/* Tab content */}
        {activeTab === 'profile' && (
          <Animated.View entering={FadeInUp.duration(400)}>
            <Card style={styles.infoCard} elevation="sm">
              <StyledText size="lg" weight="bold" style={styles.sectionTitle}>
                Personal Information
              </StyledText>
              
              {userInfo.map((item, index) => (
                <View key={index} style={[styles.infoItem, index !== userInfo.length - 1 && styles.infoItemBorder]}>
                  <View style={styles.infoItemIcon}>
                    {item.icon}
                  </View>
                  <View style={styles.infoItemContent}>
                    <StyledText size="xs" color={colors.neutral[500]}>
                      {item.label}
                    </StyledText>
                    <StyledText size="md">
                      {item.value}
                    </StyledText>
                  </View>
                </View>
              ))}
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditProfileModalVisible(true)}
              >
                <Edit size={16} color={colors.white} />
                <StyledText size="sm" color={colors.white} style={{ marginLeft: 8 }}>
                  Edit Profile
                </StyledText>
              </TouchableOpacity>
            </Card>
            
            {/* Performance card */}
            <Card style={styles.infoCard} elevation="sm">
              <StyledText size="lg" weight="bold" style={styles.sectionTitle}>
                Performance Metrics
              </StyledText>
              
              <View style={styles.performanceItem}>
                <View style={styles.performanceIcon}>
                  <Calendar size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.performanceContent}>
                  <View style={styles.performanceHeader}>
                    <StyledText size="md" weight="medium">
                      On-time Completion
                    </StyledText>
                    <StyledText size="md" weight="bold" color={colors.primary[500]}>
                      {userStats.onTimeCompletion}%
                    </StyledText>
                  </View>
                  <StyledText size="xs" color={colors.neutral[500]}>
                    Percentage of inspections completed on or before deadline
                  </StyledText>
                </View>
              </View>
              
              <View style={styles.performanceItem}>
                <View style={styles.performanceIcon}>
                  <BarChart size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.performanceContent}>
                  <View style={styles.performanceHeader}>
                    <StyledText size="md" weight="medium">
                      Average Completion Time
                    </StyledText>
                    <StyledText size="md" weight="bold" color={colors.primary[500]}>
                      {userStats.averageInspectionTime} days
                    </StyledText>
                  </View>
                  <StyledText size="xs" color={colors.neutral[500]}>
                    Average days to complete an inspection
                  </StyledText>
                </View>
              </View>
              
              {userStats.topCoachType && (
                <View style={styles.performanceItem}>
                  <View style={styles.performanceIcon}>
                    <Award size={20} color={colors.primary[500]} />
                  </View>
                  <View style={styles.performanceContent}>
                    <View style={styles.performanceHeader}>
                      <StyledText size="md" weight="medium">
                        Top Coach Type
                      </StyledText>
                      <StyledText size="md" weight="bold" color={colors.primary[500]}>
                        {userStats.topCoachType}
                      </StyledText>
                    </View>
                    <StyledText size="xs" color={colors.neutral[500]}>
                      Most frequently inspected coach type
                    </StyledText>
                  </View>
                </View>
              )}
            </Card>
          </Animated.View>
        )}
        
        {activeTab === 'activity' && (
          <Animated.View entering={FadeInUp.duration(400)}>
            <Card style={styles.infoCard} elevation="sm">
              <StyledText size="lg" weight="bold" style={styles.sectionTitle}>
                Recent Activity
              </StyledText>
              
              {userStats.recentActivity.length > 0 ? (
                userStats.recentActivity.map((activity, index) => (
                  <View key={index} style={[styles.activityItem, index !== userStats.recentActivity.length - 1 && styles.activityItemBorder]}>
                    <View style={[
                      styles.activityStatus,
                      {
                        backgroundColor: 
                          activity.type === 'completed' ? extendedColors.success[500] + '20' :
                          activity.type === 'in-progress' ? extendedColors.info[500] + '20' :
                          activity.type === 'canceled' ? extendedColors.error[500] + '20' :
                          extendedColors.warning[500] + '20'
                      }
                    ]} />
                    <View style={styles.activityContent}>
                      <StyledText size="sm" weight="medium">
                        {activity.action}
                      </StyledText>
                      <StyledText size="xs" color={colors.neutral[500]}>
                        {new Date(activity.date).toLocaleDateString()}
                      </StyledText>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <StyledText size="sm" color={colors.neutral[500]} style={{ textAlign: 'center' }}>
                    No recent activity to display
                  </StyledText>
                </View>
              )}
            </Card>
          </Animated.View>
        )}
        
        {activeTab === 'settings' && (
          <Animated.View entering={FadeInUp.duration(400)}>
            <Card style={styles.infoCard} elevation="sm">
              <StyledText size="lg" weight="bold" style={styles.sectionTitle}>
                Account Settings
              </StyledText>
              
              {menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.menuItem, index !== menuItems.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemIcon}>
                    {item.icon}
                  </View>
                  <View style={styles.menuItemContent}>
                    <StyledText 
                      size="md"
                      color={item.title === 'Logout' ? extendedColors.error[500] : undefined}
                    >
                      {item.title}
                    </StyledText>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditProfileModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <StyledText size="xl" weight="bold">Edit Profile</StyledText>
              <TouchableOpacity onPress={() => setIsEditProfileModalVisible(false)}>
                <X size={24} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView keyboardShouldPersistTaps="handled">
              <Input
                label="Full Name"
                value={editableProfile.name}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
                leftIcon={<User size={20} color={colors.neutral[500]} />}
              />
              
              <Input
                label="Phone Number"
                value={editableProfile.phone}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                leftIcon={<Phone size={20} color={colors.neutral[500]} />}
              />
              
              <Input
                label="Department"
                value={editableProfile.department}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, department: text }))}
                placeholder="Enter your department"
                leftIcon={<Building size={20} color={colors.neutral[500]} />}
              />
              
              <Input
                label="Employee ID"
                value={editableProfile.employee_id}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, employee_id: text }))}
                placeholder="Enter your employee ID"
                leftIcon={<Archive size={20} color={colors.neutral[500]} />}
              />
              
              <Input
                label="Bio"
                value={editableProfile.bio}
                onChangeText={(text) => setEditableProfile(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.bioInput}
              />
              
              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setIsEditProfileModalVisible(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title="Save Changes"
                  onPress={handleUpdateProfile}
                  loading={loading}
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={isChangePasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsChangePasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <StyledText size="xl" weight="bold">Change Password</StyledText>
              <TouchableOpacity onPress={() => setIsChangePasswordModalVisible(false)}>
                <X size={24} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView keyboardShouldPersistTaps="handled">
              <Input
                label="Current Password"
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                placeholder="Enter your current password"
                secureTextEntry
                errorMessage={passwordErrors.currentPassword}
              />
              
              <Input
                label="New Password"
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                placeholder="Enter your new password"
                secureTextEntry
                errorMessage={passwordErrors.newPassword}
              />
              
              <Input
                label="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                placeholder="Confirm your new password"
                secureTextEntry
                errorMessage={passwordErrors.confirmPassword}
              />
              
              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setIsChangePasswordModalVisible(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title="Update Password"
                  onPress={handleChangePassword}
                  loading={loading}
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </StyledView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: extendedColors.error[500],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    zIndex: 10,
  },
  syncBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: extendedColors.info[500],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  profileCard: {
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginRight: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  avatarLoading: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bioContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  bioText: {
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[500],
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  infoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  infoItemIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoItemContent: {
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  performanceIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceContent: {
    flex: 1,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  activityStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  menuItemIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  modalButton: {
    flex: 0.48,
  },
});

