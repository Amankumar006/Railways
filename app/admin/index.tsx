import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  useColorScheme
} from 'react-native';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Card } from '@/components/themed/Card';
import { supabase } from '@/lib/supabase';
import { User as UserIcon, Search, AlertCircle, Check, Trash } from 'lucide-react-native';
import { colors, colorScheme } from '@/constants/Colors';
import { User, UserRole } from '@/types';
import { useRouter, useNavigation } from 'expo-router';
import { Input } from '@/components/themed/Input';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  const navigation = useNavigation();
  
  // Set the header title
  useEffect(() => {
    navigation.setOptions({
      title: 'Admin Dashboard',
    });
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      // Format the data to match our User type
      const formattedUsers = data.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        department: profile.department || undefined,
        phone: profile.phone || undefined,
        avatar: profile.avatar_url || undefined,
      }));
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };
  
  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query) || 
          user.role.toLowerCase().includes(query) ||
          (user.department && user.department.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Change user role
  const changeUserRole = (user: User, newRole: UserRole) => {
    Alert.alert(
      'Change User Role',
      `Are you sure you want to change ${user.name}'s role from ${user.role.toUpperCase()} to ${newRole.toUpperCase()}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Change',
          onPress: async () => {
            try {
              // Update the user's role in the database
              const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', user.id);
              
              if (error) throw error;
              
              // Update local state
              setUsers(prevUsers => 
                prevUsers.map(prevUser => 
                  prevUser.id === user.id 
                    ? { ...prevUser, role: newRole } 
                    : prevUser
                )
              );
              
              Alert.alert('Success', `${user.name}'s role has been updated to ${newRole.toUpperCase()}`);
            } catch (error: any) {
              console.error('Error updating user role:', error);
              Alert.alert('Error', error.message || 'Failed to update user role');
            }
          },
        },
      ]
    );
  };
  
  // Render an individual user card
  const renderUserItem = ({ item }: { item: User }) => {
    const avatarUrl = item.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    
    return (
      <Card style={styles.userCard} elevation="sm">
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            {/* User avatar and name */}
            <View style={styles.avatarContainer}>
              <UserIcon size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.userDetails}>
              <StyledText weight="bold" size="md">{item.name}</StyledText>
              <StyledText size="sm" color={themeColors.textSecondary}>{item.email}</StyledText>
            </View>
          </View>
          
          {/* Role badge */}
          <View style={[
            styles.roleBadge, 
            { 
              backgroundColor: 
                item.role === 'manager' 
                  ? colors.secondary[500] + '30'
                  : item.role === 'supervisor'
                    ? colors.warning[500] + '30'
                    : colors.primary[500] + '30'
            }
          ]}>
            <StyledText 
              size="xs" 
              weight="medium" 
              color={
                item.role === 'manager' 
                  ? colors.secondary[500] 
                  : item.role === 'supervisor'
                    ? colors.warning[500]
                    : colors.primary[500]
              }
            >
              {item.role.toUpperCase()}
            </StyledText>
          </View>
        </View>
        
        {/* User details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <StyledText size="xs" color={themeColors.textSecondary}>Department</StyledText>
            <StyledText size="sm">{item.department || 'Not assigned'}</StyledText>
          </View>
          
          <View style={styles.detailItem}>
            <StyledText size="xs" color={themeColors.textSecondary}>Phone</StyledText>
            <StyledText size="sm">{item.phone || 'Not provided'}</StyledText>
          </View>
        </View>
        
        {/* Role change buttons */}
        <View style={styles.actionsContainer}>
          <StyledText size="xs" color={themeColors.textSecondary}>Change Role:</StyledText>
          <View style={styles.roleButtons}>
            <TouchableOpacity 
              style={[
                styles.roleButton,
                item.role === 'inspector' && styles.activeRoleButton,
                { borderColor: colors.primary[500] }
              ]}
              onPress={() => item.role !== 'inspector' && changeUserRole(item, 'inspector')}
              disabled={item.role === 'inspector'}
            >
              <StyledText 
                size="xs" 
                color={item.role === 'inspector' ? colors.white : colors.primary[500]}
              >
                Inspector
              </StyledText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.roleButton,
                item.role === 'supervisor' && styles.activeRoleButton,
                { borderColor: colors.warning[500] }
              ]}
              onPress={() => item.role !== 'supervisor' && changeUserRole(item, 'supervisor')}
              disabled={item.role === 'supervisor'}
            >
              <StyledText 
                size="xs" 
                color={item.role === 'supervisor' ? colors.white : colors.warning[500]}
              >
                Supervisor
              </StyledText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.roleButton,
                item.role === 'manager' && styles.activeRoleButton,
                { borderColor: colors.secondary[500] }
              ]}
              onPress={() => item.role !== 'manager' && changeUserRole(item, 'manager')}
              disabled={item.role === 'manager'}
            >
              <StyledText 
                size="xs" 
                color={item.role === 'manager' ? colors.white : colors.secondary[500]}
              >
                Manager
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };
  
  // Main render
  return (
    <StyledView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.neutral[500]} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* User count summary */}
      <View style={styles.summaryContainer}>
        <StyledText size="sm" color={themeColors.textSecondary}>
          Total Users: {users.length}
        </StyledText>
        <View style={styles.roleCounts}>
          <View style={styles.roleCount}>
            <StyledText size="sm" weight="medium" color={colors.primary[500]}>
              {users.filter(user => user.role === 'inspector').length} Inspectors
            </StyledText>
          </View>
          <View style={styles.roleCount}>
            <StyledText size="sm" weight="medium" color={colors.warning[500]}>
              {users.filter(user => user.role === 'supervisor').length} Supervisors
            </StyledText>
          </View>
          <View style={styles.roleCount}>
            <StyledText size="sm" weight="medium" color={colors.secondary[500]}>
              {users.filter(user => user.role === 'manager').length} Managers
            </StyledText>
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <StyledText style={{ marginTop: 16 }}>Loading users...</StyledText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={40} color={colors.error[500]} />
          <StyledText style={styles.errorText}>Error loading users</StyledText>
          <StyledText style={styles.errorSubText}>{error}</StyledText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
            <StyledText color={colors.primary[500]}>Retry</StyledText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary[500]]}
              tintColor={colors.primary[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <StyledText weight="medium" style={styles.emptyText}>
                {searchQuery ? 'No users match your search' : 'No users found'}
              </StyledText>
            </View>
          }
        />
      )}
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  summaryContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleCounts: {
    flexDirection: 'row',
  },
  roleCount: {
    marginLeft: 12,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    color: colors.error[500],
  },
  errorSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  userCard: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 8,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRoleButton: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
});