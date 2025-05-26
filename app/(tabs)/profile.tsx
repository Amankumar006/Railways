import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Text,
  Modal,
  Platform
} from 'react-native';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Card } from '@/components/themed/Card';
import { Button } from '@/components/themed/Button';
import { Input } from '@/components/themed/Input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { colorScheme, colors } from '@/constants/Colors';
import { User, Mail, Phone, Building, Shield, LogOut, Moon, Sun, CircleHelp as HelpCircle, Bell, Settings, FileText, Camera, Upload, Edit, X, RefreshCw, WifiOff } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define custom colors that are missing from the color scheme
const extendedColors = {
  ...colors,
  info: {
    500: '#0ea5e9', // Sky blue color for info
  },
  warning: {
    500: '#f59e0b', // Amber color for warnings
  },
  error: {
    400: '#f87171', // Lighter red
    500: '#ef4444', // Red
  },
  success: {
    500: '#22c55e', // Green
  }
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userStats, setUserStats] = useState({
    completedInspections: 0,
    completionRate: 0,
    pendingInspections: 0,
    inProgressInspections: 0,
    canceledInspections: 0,
    totalInspections: 0,
    lastCompletedDate: null as string | null,
    onTimeCompletion: 0
  });
  const [userProfile, setUserProfile] = useState<{
    avatar_url?: string;
    phone?: string;
    department?: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    name: user?.name || '',
    phone: '',
    department: '',
  });
  const [isOffline, setIsOffline] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [syncingData, setSyncingData] = useState(false);

  // Use hardcoded data instead of trying to fetch from non-existent tables
  useEffect(() => {
    const setupUserData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log("Setting up profile data for user:", user.id);
        
        // Use default profile data
        setUserProfile({
          phone: '',
          department: ''
        });
        
        // Use sample statistics
        const sampleStats = {
          completedInspections: 12,
          completionRate: 75,
          pendingInspections: 3,
          inProgressInspections: 1,
          canceledInspections: 0,
          totalInspections: 16,
          lastCompletedDate: new Date().toISOString(),
          onTimeCompletion: 80
        };
        
        setUserStats(sampleStats);
        
      } catch (error: any) {
        console.error('Error setting up user data:', error);
        setError(error.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    setupUserData();
  }, [user?.id]);
  
  // Update useEffect to initialize the editable profile when user data loads
  useEffect(() => {
    if (user) {
      setEditableProfile({
        name: user.name || '',
        phone: userProfile?.phone || user?.phone || '',
        department: userProfile?.department || user?.department || '',
      });
    }
  }, [user, userProfile]);
  
  // Handle profile updates with offline support
  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const updates = {
        name: editableProfile.name,
        phone: editableProfile.phone,
        department: editableProfile.department,
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
        }));
        
        Alert.alert('Success', 'Profile updated successfully');
      }
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    // Use conditional approach based on platform
    if (Platform.OS === 'web') {
      // For web platform, show a browser confirm dialog instead of Alert
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      
      if (confirmLogout) {
        try {
          console.log('Web platform: initiating logout...');
          // For web, we can simply call logout() directly
          // Our improved AuthContext logout handles web-specific logic
          await logout();
          // No need to handle errors or do additional navigation
          // as the AuthContext logout function handles everything
        } catch (error) {
          console.error('Logout error:', error);
          window.alert('Logout failed. Please try again or refresh the page.');
        }
      }
    } else {
      // For mobile platforms, use React Native Alert
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
                // Call the logout function - it handles navigation internally
                await logout();
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Logout Failed', 'Please try again');
              }
            },
            style: 'destructive',
          },
        ]
      );
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
  
  // Sync pending avatar uploads - disabled for now
  const syncPendingAvatarUploads = async () => {
    // Clear any pending avatar uploads since we can't process them
    try {
      await AsyncStorage.removeItem('pending_avatar_upload');
    } catch (error) {
      console.error('Error clearing pending avatar uploads:', error);
    }
  };
  
  // Upload image function - disabled for now since avatar_url column doesn't exist
  const uploadImageToSupabase = async (uri: string, base64: string | undefined) => {
    // Return failure since we can't upload images without the avatar_url column
    Alert.alert('Feature Unavailable', 'Profile picture uploads are not available in this version.');
    return { success: false, error: 'Feature not available' };
  };
  
  // Upload image function - disabled for now
  const uploadImage = async (uri: string, base64: string | undefined) => {
    Alert.alert('Feature Unavailable', 'Profile picture uploads are not available in this version.');
    setUploadingImage(false);
  };
  
  // User info items
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
      value: userProfile?.department || user?.department || 'Not assigned',
    },
    {
      icon: <Shield size={20} color={colors.primary[500]} />,
      label: 'Role',
      value: user?.role || 'User',
    },
  ];
  
  // Function to handle opening the edit profile modal
  const handleEditProfile = () => {
    // Reset form with current values before showing the modal
    setEditableProfile({
      name: user?.name || '',
      phone: userProfile?.phone || user?.phone || '',
      department: userProfile?.department || user?.department || '',
    });
    setIsEditing(true);
  };
  
  // Menu items
  const menuItems = [
    {
      icon: <Edit size={20} color={colors.secondary[500]} />,
      title: 'Edit Profile',
      onPress: handleEditProfile,
    },
    {
      icon: <Bell size={20} color={colors.secondary[500]} />,
      title: 'Notification Preferences',
      onPress: () => console.log('Notification preferences'),
    },
    // Add Admin Dashboard menu item for managers only
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
      icon: colorMode === 'dark' 
        ? <Sun size={20} color={colors.secondary[500]} />
        : <Moon size={20} color={colors.secondary[500]} />,
      title: `${colorMode === 'dark' ? 'Light' : 'Dark'} Mode`,
      onPress: () => console.log('Toggle theme'),
    },
    {
      icon: <Settings size={20} color={colors.secondary[500]} />,
      title: 'Settings',
      onPress: () => console.log('Settings'),
    },
  ];
  
  // Use default avatar
  const avatarUrl = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  
  // Fixed loading condition
  if (loading) {
    return (
      <StyledView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <StyledText style={{ marginTop: 16 }}>Loading profile...</StyledText>
      </StyledView>
    );
  }
  
  // Show error state if there was an error
  if (error) {
    return (
      <StyledView style={[styles.container, styles.errorContainer]}>
        <StyledText style={styles.errorText}>Error loading profile</StyledText>
        <StyledText style={styles.errorSubText}>{error}</StyledText>
        <Button
          title="Try Again"
          onPress={() => {
            setLoading(true);
            // Re-trigger the effect by force updating the loading state
            setTimeout(() => {}, 100);
          }}
          style={{ marginTop: 20 }}
        />
      </StyledView>
    );
  }
  
  // Normal profile view when data is loaded
  return (
    <StyledView style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color={colors.white} />
          <StyledText size="sm" color={colors.white} style={{ marginLeft: 8 }}>
            You are offline
          </StyledText>
        </View>
      )}
      
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
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          (isOffline || pendingChanges) && { paddingTop: 40 }
        ]}
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
                    <View style={[styles.avatar, { backgroundColor: colors.primary[500] }]}>
                  <StyledText size="xl" weight="bold" color={colors.white}>
                    {user?.name?.charAt(0) || 'U'}
                  </StyledText>
                </View>
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
                        : colors.primary[500] + '20' 
                    }
                  ]}>
                    <StyledText 
                      size="xs" 
                      weight="medium" 
                      color={user?.role === 'manager' ? colors.secondary[500] : colors.primary[500]}
                    >
                      {user?.role?.toUpperCase() || 'USER'}
                    </StyledText>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <StyledText size="2xl" weight="bold" color={colors.primary[500]}>
                  {loading ? '-' : userStats.completedInspections}
                </StyledText>
                <StyledText size="xs" color={themeColors.textSecondary}>
                  Inspections
                </StyledText>
              </View>
              
              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
              
              <View style={styles.statItem}>
                <StyledText size="2xl" weight="bold" color={colors.primary[500]}>
                  {loading ? '-' : userStats.completionRate}%
                </StyledText>
                <StyledText size="xs" color={themeColors.textSecondary}>
                  Completion Rate
                </StyledText>
              </View>
            </View>
          </Card>
        </Animated.View>
        
        {/* Enhanced Statistics Card */}
        <Card style={styles.section}>
          <StyledText size="md" weight="bold" style={styles.sectionTitle}>
            Performance Metrics
          </StyledText>
          
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <StyledText size="2xl" weight="bold" color={extendedColors.primary[500]}>
                {loading ? '-' : userStats.completedInspections}
              </StyledText>
              <StyledText size="xs" color={themeColors.textSecondary}>
                Completed
              </StyledText>
            </View>
            
            <View style={styles.performanceItem}>
              <StyledText size="2xl" weight="bold" color={extendedColors.warning[500]}>
                {loading ? '-' : userStats.pendingInspections}
              </StyledText>
              <StyledText size="xs" color={themeColors.textSecondary}>
                Pending
              </StyledText>
            </View>
            
            <View style={styles.performanceItem}>
              <StyledText size="2xl" weight="bold" color={extendedColors.info[500]}>
                {loading ? '-' : userStats.inProgressInspections}
              </StyledText>
              <StyledText size="xs" color={themeColors.textSecondary}>
                In Progress
              </StyledText>
            </View>
            
            <View style={styles.performanceItem}>
              <StyledText size="2xl" weight="bold" color={extendedColors.error[500]}>
                {loading ? '-' : userStats.canceledInspections}
              </StyledText>
              <StyledText size="xs" color={themeColors.textSecondary}>
                Canceled
              </StyledText>
            </View>
          </View>
          
          <View style={styles.performanceDetail}>
            <StyledText weight="medium">Completion Rate</StyledText>
            <View style={styles.progressBarContainer}>
              <View style={[
                styles.progressBar, 
                { width: `${userStats.completionRate}%`, backgroundColor: colors.primary[500] }
              ]} />
            </View>
            <StyledText>{userStats.completionRate}%</StyledText>
          </View>
          
          <View style={styles.performanceDetail}>
            <StyledText weight="medium">On-Time Completion</StyledText>
            <View style={styles.progressBarContainer}>
              <View style={[
                styles.progressBar, 
                { width: `${userStats.onTimeCompletion}%`, backgroundColor: colors.success[500] }
              ]} />
            </View>
            <StyledText>{userStats.onTimeCompletion}%</StyledText>
          </View>
          
          {userStats.lastCompletedDate && (
            <StyledText size="xs" color={themeColors.textSecondary} style={{ marginTop: 10 }}>
              Last completed inspection: {new Date(userStats.lastCompletedDate).toLocaleDateString()}
            </StyledText>
          )}
        </Card>
        
        {/* User Info */}
        <Card style={styles.section}>
          <StyledText size="md" weight="bold" style={styles.sectionTitle}>
            Personal Information
          </StyledText>
          
          {userInfo.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.infoItem, 
                index < userInfo.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.border,
                }
              ]}
            >
              <View style={styles.infoIcon}>
                {item.icon}
              </View>
              
              <View style={styles.infoContent}>
                <StyledText size="xs" color={themeColors.textSecondary}>
                  {item.label}
                </StyledText>
                <StyledText size="md">
                  {item.value}
                </StyledText>
              </View>
            </View>
          ))}
        </Card>
        
        {/* Menu Items */}
        <Card style={styles.section}>
          <StyledText size="md" weight="bold" style={styles.sectionTitle}>
            Settings
          </StyledText>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.menuItem, 
                index < menuItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.border,
                }
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                {item.icon}
              </View>
              
              <StyledText style={styles.menuTitle}>
                {item.title}
              </StyledText>
            </TouchableOpacity>
          ))}
        </Card>
        
        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          icon={<LogOut size={18} color={colors.error[500]} />}
          iconPosition="left"
          textStyle={{ color: colors.error[500] }}
          style={styles.logoutButton}
        />
        
        {/* Version info */}
        <StyledText 
          size="xs" 
          color={themeColors.textSecondary}
          style={styles.versionText}
        >
          Version 1.0.0
        </StyledText>
      </ScrollView>
      
      {/* Profile Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditing}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <StyledText size="xl" weight="bold">Edit Profile</StyledText>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <X size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <StyledText style={styles.label}>Name</StyledText>
              <Input
                value={editableProfile.name}
                onChangeText={(text) => setEditableProfile({...editableProfile, name: text})}
                placeholder="Your name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <StyledText style={styles.label}>Phone</StyledText>
              <Input
                value={editableProfile.phone}
                onChangeText={(text) => setEditableProfile({...editableProfile, phone: text})}
                placeholder="Your phone number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <StyledText style={styles.label}>Department</StyledText>
              <Input
                value={editableProfile.department}
                onChangeText={(text) => setEditableProfile({...editableProfile, department: text})}
                placeholder="Your department"
              />
            </View>
            
            <View style={styles.modalActions}>
              <Button
                onPress={() => setIsEditing(false)}
                style={styles.cancelButton}
                variant="secondary"
                title="Cancel"
              />
              <Button
                onPress={handleUpdateProfile}
                style={styles.saveButton}
                loading={loading}
                title="Save Changes"
              />
            </View>
          </View>
        </View>
      </Modal>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[500] + '80',
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[500] + '80',
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
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '100%',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIcon: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    flex: 1,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  versionText: {
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error[500],
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: colors.error[400],
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    marginRight: 10,
  },
  saveButton: {
    minWidth: 120,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  performanceItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.error[500],
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  syncBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary[500],
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});