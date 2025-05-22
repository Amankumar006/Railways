import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, RefreshControl, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { NotificationItem } from '@/components/NotificationItem';
import { supabase } from '@/lib/supabase';
import { Notification, User } from '@/types';
import { colorScheme, colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function NotificationsScreen() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  // Extra security check - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  
  useEffect(() => {
    fetchNotifications();
    
    // If user is a manager, fetch pending users
    if (user?.role === 'manager') {
      fetchPendingUsers();
    }
    
    // Set up real-time subscription for notifications
    const notificationsSubscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();
      
    // Set up real-time subscription for profiles (to detect new users)
    let profilesSubscription: ReturnType<typeof supabase.channel> | null = null;
    if (user?.role === 'manager') {
      profilesSubscription = supabase
        .channel('profiles')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
          },
          () => {
            fetchPendingUsers();
          }
        )
        .subscribe();
    }
      
    return () => {
      supabase.removeChannel(notificationsSubscription);
      if (profilesSubscription) {
        supabase.removeChannel(profilesSubscription);
      }
    };
  }, [user?.id, user?.role]);
  
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Map the data to use created_at as timestamp for compatibility with the rest of the code
      const mappedData = (data || []).map(notification => ({
        ...notification,
        timestamp: notification.created_at
      }));
      
      setNotifications(mappedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch pending users for managers
  const fetchPendingUsers = async () => {
    if (!user?.id || user.role !== 'manager') return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPendingUsers(data as User[]);
      
      // Create approval notifications for each pending user if they don't exist
      for (const pendingUser of data) {
        // Check if we already have a notification for this user
        const existingNotification = notifications.find(
          n => n.type === 'approval' && n.relatedId === pendingUser.id
        );
        
        if (!existingNotification) {
          // Create a new notification for the manager
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              title: 'New User Registration',
              message: `${pendingUser.name} (${pendingUser.email}) has registered and is waiting for approval.`,
              type: 'approval',
              read: false,
              relatedId: pendingUser.id
            });
        }
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    }
  };
  
  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      try {
        // Mark notification as read in database
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id);
          
        if (error) throw error;
        
        // Update local state
        setNotifications(prev => 
          prev.map(item => 
            item.id === notification.id 
              ? { ...item, read: true } 
              : item
          )
        );
      } catch (error) {
        console.error('Error updating notification:', error);
      }
    }
    
    // Handle different notification types
    switch (notification.type) {
      case 'schedule':
        // Navigate to trips page instead of schedules
        router.push('/trips');
        break;
      // Add other notification type handlers as needed
    }
  };
  
  // Handle approving a user
  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      // Remove the notification for this user
      const notificationToRemove = notifications.find(
        n => n.type === 'approval' && n.relatedId === userId
      );
      
      if (notificationToRemove) {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationToRemove.id);
          
        // Update local state
        setNotifications(notifications.filter(n => n.id !== notificationToRemove.id));
      }
      
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
  
  // Handle rejecting a user
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

              if (error) throw error;

              // Remove the notification for this user
              const notificationToRemove = notifications.find(
                n => n.type === 'approval' && n.relatedId === userId
              );
              
              if (notificationToRemove) {
                await supabase
                  .from('notifications')
                  .delete()
                  .eq('id', notificationToRemove.id);
                  
                // Update local state
                setNotifications(notifications.filter(n => n.id !== notificationToRemove.id));
              }
              
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
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };
  
  // Group notifications by date (today, yesterday, earlier)
  const todayDate = new Date().toDateString();
  const yesterdayDate = new Date(Date.now() - 86400000).toDateString();
  
  const groupedNotifications = {
    today: notifications.filter(n => new Date(n.timestamp).toDateString() === todayDate),
    yesterday: notifications.filter(n => new Date(n.timestamp).toDateString() === yesterdayDate),
    earlier: notifications.filter(n => 
      new Date(n.timestamp).toDateString() !== todayDate && 
      new Date(n.timestamp).toDateString() !== yesterdayDate
    ),
  };
  
  // Render section header
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <StyledText size="sm" weight="medium" color={themeColors.textSecondary}>
        {title}
      </StyledText>
    </View>
  );
  
  return (
    <StyledView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <StyledText size="2xl" weight="bold">
          Notifications
        </StyledText>
      </View>
      
      {/* Notifications list */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={[
            ...(groupedNotifications.today.length > 0 
              ? [{ id: 'header-today', type: 'header', title: 'Today' }] 
              : []),
            ...groupedNotifications.today,
            
            ...(groupedNotifications.yesterday.length > 0 
              ? [{ id: 'header-yesterday', type: 'header', title: 'Yesterday' }] 
              : []),
            ...groupedNotifications.yesterday,
            
            ...(groupedNotifications.earlier.length > 0 
              ? [{ id: 'header-earlier', type: 'header', title: 'Earlier' }] 
              : []),
            ...groupedNotifications.earlier,
          ]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: any }) => {
            if (item.type === 'header') {
              return renderSectionHeader(item.title);
            }
            return (
              <View style={styles.notificationContainer}>
                <NotificationItem 
                  notification={item} 
                  onPress={handleNotificationPress}
                  onApprove={user?.role === 'manager' ? handleApproveUser : undefined}
                  onReject={user?.role === 'manager' ? handleRejectUser : undefined}
                  showApprovalButtons={user?.role === 'manager'}
                />
              </View>
            );
          }}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <StyledText size="lg" weight="medium" style={styles.emptyText}>
                No notifications
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
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    flexGrow: 1,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  notificationContainer: {
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  emptyText: {
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});