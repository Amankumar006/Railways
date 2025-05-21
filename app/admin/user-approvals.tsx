import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Button } from '@/components/themed/Button';
import { colors } from '@/constants/Colors';
import { AlertTriangle, Check, X, User, Building2, Mail, Phone } from 'lucide-react-native';
import { User as UserType, ApprovalStatus } from '@/types';

// Extended user type with approval status
interface PendingUser extends Omit<UserType, 'approvalStatus'> {
  approvalStatus: ApprovalStatus;
  created_at: string;
}

export default function UserApprovalsScreen() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPendingUsers(data as PendingUser[]);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      Alert.alert('Error', 'Failed to load pending users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update the local state
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      
      // Create a notification for the approved user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Account Approved',
          message: 'Your account has been approved. You can now log in to the system.',
          type: 'system',
          read: false
        });

      Alert.alert('Success', 'User has been approved');
    } catch (error) {
      console.error('Error approving user:', error);
      Alert.alert('Error', 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    Alert.prompt(
      'Reject User',
      'Please provide a reason for rejection (optional):',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ 
                  approval_status: 'rejected',
                  approval_denied_reason: reason || 'No reason provided'
                })
                .eq('id', userId);

              if (error) {
                throw error;
              }

              // Update the local state
              setPendingUsers(pendingUsers.filter(user => user.id !== userId));
              
              // Create a notification for the rejected user
              await supabase
                .from('notifications')
                .insert({
                  user_id: userId,
                  title: 'Account Rejected',
                  message: `Your account registration was denied${reason ? ': ' + reason : '.'}`,
                  type: 'system',
                  read: false
                });

              Alert.alert('Success', 'User has been rejected');
            } catch (error) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 'Failed to reject user');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingUsers();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderUserCard = ({ item }: { item: PendingUser }) => (
    <StyledView style={styles.card} backgroundColor={colors.white}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <User size={24} color={colors.primary[500]} />
          </View>
          <View>
            <StyledText size="lg" weight="bold">
              {item.name}
            </StyledText>
            <StyledText size="sm" color={colors.neutral[500]}>
              Registered {formatDate(item.created_at)}
            </StyledText>
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
        <Button
          title="Approve"
          onPress={() => handleApproveUser(item.id)}
          style={styles.approveButton}
          size="sm"
        />
        <TouchableOpacity
          onPress={() => handleRejectUser(item.id)}
          style={styles.rejectButtonContainer}
        >
          <StyledText size="sm" weight="medium" color={colors.white}>
            Reject
          </StyledText>
        </TouchableOpacity>
      </View>
    </StyledView>
  );

  const renderEmptyList = () => (
    <StyledView style={styles.emptyContainer} backgroundColor="transparent">
      <AlertTriangle size={64} color={colors.neutral[300]} />
      <StyledText size="lg" weight="bold" style={styles.emptyTitle}>
        No Pending Approvals
      </StyledText>
      <StyledText size="md" style={styles.emptyText} color={colors.neutral[500]}>
        There are no users waiting for approval at the moment.
      </StyledText>
    </StyledView>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 12,
  },
  approveButton: {
    minWidth: 100,
  },
  rejectButtonContainer: {
    minWidth: 100,
    backgroundColor: colors.error[500],
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
