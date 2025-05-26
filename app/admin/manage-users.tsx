import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Input } from '@/components/themed/Input';
import { colors } from '@/constants/Colors';
import { User, UserRole } from '@/types';
import { Search, User as UserIcon, Building2, Mail, Phone, UserCheck } from 'lucide-react-native';

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) throw error;

      const formattedUsers = data.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        department: profile.department || undefined,
        phone: profile.phone || undefined,
        approvalStatus: profile.approval_status,
      }));

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

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
              const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', user.id);
              
              if (error) throw error;
              
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

  const renderUserCard = ({ item }: { item: User }) => (
    <StyledView style={styles.card} backgroundColor={colors.white}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <UserIcon size={24} color={colors.primary[500]} />
          </View>
          <View>
            <StyledText size="lg" weight="bold">
              {item.name}
            </StyledText>
            <View style={styles.roleBadge}>
              <StyledText size="sm" color={colors.primary[500]}>
                {item.role.toUpperCase()}
              </StyledText>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.userDetails}>
        <View style={styles.detailItem}>
          <Mail size={16} color={colors.neutral[500]} style={styles.detailIcon} />
          <StyledText size="sm">{item.email}</StyledText>
        </View>
        {item.phone && (
          <View style={styles.detailItem}>
            <Phone size={16} color={colors.neutral[500]} style={styles.detailIcon} />
            <StyledText size="sm">{item.phone}</StyledText>
          </View>
        )}
        {item.department && (
          <View style={styles.detailItem}>
            <Building2 size={16} color={colors.neutral[500]} style={styles.detailIcon} />
            <StyledText size="sm">{item.department}</StyledText>
          </View>
        )}
      </View>
      
      <View style={styles.actions}>
        <StyledText size="sm" color={colors.neutral[600]} style={styles.actionLabel}>
          Change Role:
        </StyledText>
        <View style={styles.roleButtons}>
          <TouchableOpacity 
            style={[
              styles.roleButton,
              item.role === 'inspector' && styles.activeRoleButton
            ]}
            onPress={() => item.role !== 'inspector' && changeUserRole(item, 'inspector')}
            disabled={item.role === 'inspector'}
          >
            <StyledText 
              size="sm" 
              color={item.role === 'inspector' ? colors.white : colors.primary[500]}
            >
              Inspector
            </StyledText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.roleButton,
              item.role === 'manager' && styles.activeRoleButton
            ]}
            onPress={() => item.role !== 'manager' && changeUserRole(item, 'manager')}
            disabled={item.role === 'manager'}
          >
            <StyledText 
              size="sm" 
              color={item.role === 'manager' ? colors.white : colors.primary[500]}
            >
              Manager
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </StyledView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <StyledText size="2xl" weight="bold">
            Manage Users
          </StyledText>
          <TouchableOpacity 
            style={styles.approvalButton}
            onPress={() => router.push('/admin/user-approvals')}
          >
            <UserCheck size={20} color={colors.white} style={styles.approvalIcon} />
            <StyledText size="sm" color={colors.white}>
              Pending Approvals
            </StyledText>
          </TouchableOpacity>
        </View>
        <StyledText size="md" color={colors.neutral[600]}>
          {users.length} total users
        </StyledText>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.neutral[500]} />}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
            <StyledText size="lg" weight="medium" style={styles.emptyText}>
              {searchQuery ? 'No users match your search' : 'No users found'}
            </StyledText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  approvalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approvalIcon: {
    marginRight: 6,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  userDetails: {
    padding: 16,
    backgroundColor: colors.neutral[50],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  actionLabel: {
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRoleButton: {
    backgroundColor: colors.primary[500],
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.neutral[500],
  },
}); 