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
  Text
} from 'react-native';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Card } from '@/components/themed/Card';
import { Button } from '@/components/themed/Button';
import { useAuth } from '@/context/AuthContext';
import { supabase, db } from '@/lib/supabase';
import { colorScheme, colors } from '@/constants/Colors';
import { User, Mail, Phone, Building, Shield, LogOut, Moon, Sun, CircleHelp as HelpCircle, Bell, Settings, FileText, Camera, Upload } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userStats, setUserStats] = useState({
    completedInspections: 0,
    completionRate: 0
  });
  const [userProfile, setUserProfile] = useState<{
    avatar_url?: string;
    phone?: string;
    department?: string;
  } | null>(null);
  
  // Fetch user statistics from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching profile data for user:", user.id);
        
        // Get user profile with avatar
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url, phone, department')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Profile error:", profileError);
          throw profileError;
        }
        
        console.log("Profile data retrieved:", profileData);
        setUserProfile(profileData);
        
        // Safely fetch completed inspections count
        let completedCount = 0;
        let totalCount = 0;
        
        try {
          // Get completed inspections count
          const completedResult = await supabase
            .from('schedules')
            .select('id', { count: 'exact' })
            .eq('status', 'completed')
            .eq('assigned_to_id', user.id);
            
          completedCount = completedResult.count || 0;
          
          // Get total inspections assigned to user
          const totalResult = await supabase
            .from('schedules')
            .select('id', { count: 'exact' })
            .eq('assigned_to_id', user.id);
            
          totalCount = totalResult.count || 0;
        } catch (statsError) {
          console.error("Error fetching stats:", statsError);
          // Continue execution - we'll just show 0 for stats
        }
        
        // Calculate completion rate
        const completionRate = totalCount > 0 
          ? Math.round((completedCount / totalCount) * 100) 
          : 0;
        
        setUserStats({
          completedInspections: completedCount || 0,
          completionRate
        });
        
      } catch (error: any) {
        console.error('Error fetching user data:', error);
        setError(error.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user?.id]);
  
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
          onPress: () => logout(),
          style: 'destructive',
        },
      ]
    );
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
        await uploadImage(result.assets[0].uri, result.assets[0].base64);
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
        await uploadImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not select image');
    }
  };
  
  // Upload image to Supabase Storage
  const uploadImage = async (uri: string, base64: string | undefined) => {
    if (!user?.id || !base64) {
      Alert.alert('Error', 'Could not upload image');
      return;
    }
    
    setUploadingImage(true);
    
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
      
      Alert.alert('Success', 'Profile photo updated successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Failed', error.message || 'Could not upload image');
    } finally {
      setUploadingImage(false);
    }
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
  
  // Menu items
  const menuItems = [
    {
      icon: <Bell size={20} color={colors.secondary[500]} />,
      title: 'Notification Preferences',
      onPress: () => console.log('Notification preferences'),
    },
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
  
  // Get avatar URL
  const avatarUrl = userProfile?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  
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
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
                  <View style={[styles.roleBadge, { backgroundColor: colors.primary[500] + '20' }]}>
                    <StyledText 
                      size="xs" 
                      weight="medium" 
                      color={colors.primary[500]}
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
    width: '100%',
    height: '100%',
    borderRadius: 35,
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
});