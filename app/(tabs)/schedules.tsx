import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  View,
  RefreshControl,
  useColorScheme,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { Input } from '@/components/themed/Input';
import { Card } from '@/components/themed/Card';
import { ScheduleCard } from '@/components/ScheduleCard';
import { db } from '@/lib/supabase';
import { Schedule, InspectionStatus } from '@/types';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { colors, colorScheme } from '@/constants/Colors';
import { StatusBadge } from '@/components/StatusBadge';

export default function SchedulesScreen() {
  const router = useRouter();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  // Load data on component mount
  useEffect(() => {
    fetchSchedules();
    
    // Set up realtime subscription
    const subscription = db.subscriptions.schedules((payload) => {
      // Refresh data when changes occur
      fetchSchedules();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const fetchSchedules = async () => {
    setLoading(true);
    
    try {
      const data = await db.schedules.getAll();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusFilter = (status: InspectionStatus | 'all') => {
    setStatusFilter(status);
  };
  
  const handleSchedulePress = (schedule: Schedule) => {
    router.push(`/schedules/${schedule.id}`);
  };
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedules();
    setRefreshing(false);
  };
  
  // Filter schedules based on search query and status filter
  const filteredSchedules = schedules.filter(schedule => {
    const matchesQuery = 
      schedule.coach.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.coach.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;
    
    return matchesQuery && matchesStatus;
  });
  
  // Render status filter buttons
  const renderStatusFilters = () => {
    const statuses: Array<InspectionStatus | 'all'> = ['all', 'pending', 'in-progress', 'completed', 'canceled'];
    
    return (
      <View style={styles.filtersContainer}>
        <FlatList
          data={statuses}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === item && {
                  backgroundColor: item === 'all' 
                    ? colors.primary[500] 
                    : getStatusColor(item as InspectionStatus)
                }
              ]}
              onPress={() => handleStatusFilter(item)}
            >
              {item === 'all' ? (
                <StyledText 
                  size="sm" 
                  weight="medium"
                  color={statusFilter === 'all' ? colors.white : themeColors.text}
                >
                  All
                </StyledText>
              ) : (
                <StatusBadge 
                  status={item as InspectionStatus} 
                  size="sm"
                />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };
  
  // Get color for status
  const getStatusColor = (status: InspectionStatus): string => {
    switch (status) {
      case 'pending':
        return colors.warning[500];
      case 'in-progress':
        return colors.primary[500];
      case 'completed':
        return colors.success[500];
      case 'canceled':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };
  
  return (
    <StyledView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <StyledText size="2xl" weight="bold">
          Schedules
        </StyledText>
        
        <TouchableOpacity style={styles.filterIcon}>
          <SlidersHorizontal size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Search input */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search coach, type, location..."
          value={searchQuery}
          onChangeText={handleSearch}
          leftIcon={<Search size={20} color={colors.neutral[500]} />}
          containerStyle={styles.searchInput}
        />
      </View>
      
      {/* Status filters */}
      {renderStatusFilters()}
      
      {/* Schedule list */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : filteredSchedules.length > 0 ? (
        <FlatList
          data={filteredSchedules}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <ScheduleCard 
                schedule={item} 
                onPress={handleSchedulePress}
              />
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <StyledText size="lg" weight="medium" style={styles.emptyText}>
              No schedules found
            </StyledText>
            <StyledText size="sm" color={themeColors.textSecondary} style={styles.emptySubtext}>
              Try adjusting your filters or search terms
            </StyledText>
          </Card>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  filterIcon: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  filtersContainer: {
    paddingLeft: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  cardContainer: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});