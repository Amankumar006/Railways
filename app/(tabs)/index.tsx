import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { useAuth } from '@/context/AuthContext';
import { File, Bell, BarChart as Analytics, Users } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { colorScheme } from '@/constants/Colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  const isManager = user?.role === 'manager';
  
  // Extra security check - redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
    
    // Log user role for debugging
    console.log('Current user role:', user?.role);
  }, [isAuthenticated, router, user]);
  
  const handleTripPress = () => {
    // Navigate to trips page
    router.push('/trips');
  };
  
  const handleReportsPress = () => {
    // For now, just show an alert since these pages don't exist yet
    alert('Analytics reporting coming soon!');
    // Future implementation when reports page is created
    // router.push('/reports');
  };
  
  const handleUsersPress = () => {
    // For now, just show an alert since these pages don't exist yet
    alert('User management coming soon!');
    // Future implementation when users page is created
    // router.push('/users');
  };
  
  return (
    <StyledView style={styles.container}>
      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <StyledText size="lg" weight="bold">
          Welcome back{user?.name ? `, ${user.name}` : ''}!
        </StyledText>
        
        {isManager && (
          <StyledText style={{ marginTop: 5, color: '#f39c12' }}>
            Manager Dashboard
          </StyledText>
        )}
      </View>
      
      {/* Role-specific dashboard content */}
      {isManager ? (
        /* Manager Dashboard - Review & Approve Reports */
        <>
          <TouchableOpacity onPress={handleTripPress} style={styles.cardContainer}>
            <View style={styles.cardContent}>
              <View>
                <StyledText size="xl" weight="bold">
                  Review Reports
                </StyledText>
                <StyledText size="sm" style={{ marginTop: 5 }}>
                  Review and approve submitted inspection reports
                </StyledText>
              </View>
              <File size={32} color={themeColors.text} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleReportsPress} style={styles.cardContainer}>
            <View style={styles.cardContent}>
              <View>
                <StyledText size="xl" weight="bold">
                  Analytics Dashboard
                </StyledText>
                <StyledText size="sm" style={{ marginTop: 5 }}>
                  View inspection statistics and reporting trends
                </StyledText>
              </View>
              <Analytics size={32} color={themeColors.text} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleUsersPress} style={styles.cardContainer}>
            <View style={styles.cardContent}>
              <View>
                <StyledText size="xl" weight="bold">
                  User Management
                </StyledText>
                <StyledText size="sm" style={{ marginTop: 5 }}>
                  Manage inspectors and supervisors
                </StyledText>
              </View>
              <Users size={32} color={themeColors.text} />
            </View>
          </TouchableOpacity>
        </>
      ) : (
        /* Inspector Dashboard - Create Trip Reports */
        <TouchableOpacity onPress={handleTripPress} style={styles.cardContainer}>
          <View style={styles.cardContent}>
            <View>
              <StyledText size="xl" weight="bold">
                Trip Reports
              </StyledText>
              <StyledText size="sm" style={{ marginTop: 5 }}>
                Create and submit inspection reports
              </StyledText>
            </View>
            <File size={32} color={themeColors.text} />
          </View>
        </TouchableOpacity>
      )}
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardContainer: {
    marginTop: 10,
    backgroundColor: 'white',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eaeaea',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});