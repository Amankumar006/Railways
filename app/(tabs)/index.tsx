import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  TouchableOpacity, 
  useColorScheme,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Card } from '@/components/themed/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { ScheduleCard } from '@/components/ScheduleCard';
import { useAuth } from '@/context/AuthContext';
import { db, supabase } from '@/lib/supabase';
import { Schedule } from '@/types';
import { colorScheme, colors } from '@/constants/Colors';
import { BellDot, Search, ClipboardCheck, Clock, CalendarCheck, ChartBar as BarChart } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filter schedules by status
  const pendingSchedules = schedules.filter(s => s.status === 'pending');
  const inProgressSchedules = schedules.filter(s => s.status === 'in-progress');
  const completedSchedules = schedules.filter(s => s.status === 'completed');
  
  // Load data on component mount
  useEffect(() => {
    fetchData();
    
    // Set up realtime subscription for schedules
    const subscription = db.subscriptions.schedules((payload) => {
      // Refresh data when changes occur
      fetchData();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch all schedules
      const scheduleData = await db.schedules.getAll();
      setSchedules(scheduleData);
      
      // Fetch unread notifications count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .eq('user_id', user?.id);
        
      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };
  
  const handleSchedulePress = (scheduleId: string) => {
    router.push(`/schedules/${scheduleId}`);
  };
  
  const renderStatusCard = (title: string, count: number, icon: React.ReactNode, color: string) => (
    <Card style={[styles.statusCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statusCardContent}>
        <View style={[styles.statusCardIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <View>
          <StyledText size="lg" weight="bold">
            {count}
          </StyledText>
          <StyledText size="xs" color={themeColors.textSecondary}>
            {title}
          </StyledText>
        </View>
      </View>
    </Card>
  );
  
  return (
    <StyledView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <StyledText size="lg" weight="bold">
            Welcome back,
          </StyledText>
          <StyledText size="xl" weight="bold">
            {user?.name || 'Inspector'}
          </StyledText>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
          >
            {unreadNotifications > 0 ? (
              <BellDot size={24} color={colors.primary[500]} />
            ) : (
              <BellDot size={24} color={themeColors.text} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/schedules')}
          >
            <Search size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Overview */}
        <Animated.View 
          style={styles.statsContainer}
          entering={FadeInDown.duration(600).delay(300)}
        >
          <StyledText size="md" weight="bold" style={styles.sectionTitle}>
            Overview
          </StyledText>
          
          <View style={styles.statsRow}>
            {renderStatusCard(
              'Pending',
              pendingSchedules.length,
              <Clock size={20} color={colors.warning[500]} />,
              colors.warning[500]
            )}
            
            {renderStatusCard(
              'In Progress',
              inProgressSchedules.length,
              <ClipboardCheck size={20} color={colors.primary[500]} />,
              colors.primary[500]
            )}
          </View>
          
          <View style={styles.statsRow}>
            {renderStatusCard(
              'Completed',
              completedSchedules.length,
              <CalendarCheck size={20} color={colors.success[500]} />,
              colors.success[500]
            )}
            
            {renderStatusCard(
              'Total',
              schedules.length,
              <BarChart size={20} color={colors.secondary[500]} />,
              colors.secondary[500]
            )}
          </View>
        </Animated.View>
        
        {/* Upcoming Inspections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <StyledText size="md" weight="bold">
              Upcoming Inspections
            </StyledText>
            
            <TouchableOpacity onPress={() => router.push('/schedules')}>
              <StyledText size="sm" color={colors.primary[500]}>
                See All
              </StyledText>
            </TouchableOpacity>
          </View>
          
          {pendingSchedules.length > 0 ? (
            <FlatList
              data={pendingSchedules.slice(0, 3)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ScheduleCard 
                  schedule={item} 
                  onPress={() => handleSchedulePress(item.id)} 
                />
              )}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <StyledText size="md" style={styles.emptyText}>
                No upcoming inspections
              </StyledText>
            </Card>
          )}
        </View>
        
        {/* In Progress Inspections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <StyledText size="md" weight="bold">
              In Progress
            </StyledText>
            
            <TouchableOpacity onPress={() => router.push('/schedules')}>
              <StyledText size="sm" color={colors.primary[500]}>
                See All
              </StyledText>
            </TouchableOpacity>
          </View>
          
          {inProgressSchedules.length > 0 ? (
            <FlatList
              data={inProgressSchedules}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ScheduleCard 
                  schedule={item} 
                  onPress={() => handleSchedulePress(item.id)} 
                />
              )}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <StyledText size="md" style={styles.emptyText}>
                No inspections in progress
              </StyledText>
            </Card>
          )}
        </View>
        
        {/* Bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </StyledView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusCard: {
    width: '48%',
    padding: 12,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});