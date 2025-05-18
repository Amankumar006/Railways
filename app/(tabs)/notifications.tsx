import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, RefreshControl, useColorScheme, ActivityIndicator } from 'react-native';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { NotificationItem } from '@/components/NotificationItem';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types';
import { colorScheme, colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function NotificationsScreen() {
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  const { user } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    fetchNotifications();
    
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
      
    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, [user?.id]);
  
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
        
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
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
    
    // In a real app, we would navigate to the related screen based on the notification type
    // and relatedId, or handle system notifications appropriately
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