import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Image, 
  TouchableOpacity, 
  Alert,
  useColorScheme,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StyledView } from '@/components/themed/StyledView';
import { StyledText } from '@/components/themed/StyledText';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/themed/Button';
import { Card } from '@/components/themed/Card';
import { db } from '@/lib/supabase';
import { Schedule } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { colorScheme, colors } from '@/constants/Colors';
import { ChevronLeft, Calendar, Clock, MapPin, User, File as FileEdit, CirclePlay as PlayCircle, CircleCheck as CheckCircle, Circle as XCircle, Share2, FileText } from 'lucide-react-native';

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const colorMode = useColorScheme() ?? 'light';
  const themeColors = colorScheme[colorMode];
  
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        if (!id || typeof id !== 'string') {
          throw new Error('Invalid schedule ID');
        }
        
        const data = await db.schedules.getById(id);
        setSchedule(data);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Failed to load schedule details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedule();
    
    // Set up realtime subscription
    const subscription = db.subscriptions.schedules((payload) => {
      if (payload.new.id === id) {
        // Refresh data when this schedule changes
        fetchSchedule();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [id]);
  
  // Show loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{
          headerShown: false,
        }} />
        <StyledView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={themeColors.text} />
            </TouchableOpacity>
            <StyledText size="xl" weight="bold">
              Loading...
            </StyledText>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        </StyledView>
      </>
    );
  }
  
  // Handle if schedule not found
  if (!schedule || error) {
    return (
      <>
        <Stack.Screen options={{
          headerShown: false,
        }} />
        <StyledView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={themeColors.text} />
            </TouchableOpacity>
            <StyledText size="xl" weight="bold">
              Not Found
            </StyledText>
          </View>
          
          <StyledView style={styles.notFoundContainer}>
            <StyledText size="lg">{error || 'Schedule not found'}</StyledText>
            <Button 
              title="Go Back" 
              onPress={() => router.back()} 
              style={styles.goBackButton}
            />
          </StyledView>
        </StyledView>
      </>
    );
  }
  
  // Format date to readable string
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle status change
  const handleUpdateStatus = async (newStatus: 'in-progress' | 'completed' | 'canceled') => {
    Alert.alert(
      'Update Status',
      `Are you sure you want to mark this inspection as ${newStatus}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: async () => {
            try {
              // Update the status in Supabase
              const updates: any = { 
                status: newStatus,
                // If completed, set completed date
                ...(newStatus === 'completed' ? { completed_date: new Date().toISOString() } : {})
              };
              
              await db.schedules.update(schedule.id, updates);
              
              Alert.alert(
                'Status Updated', 
                `Inspection status updated to ${newStatus}`
              );
              router.back();
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update status. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  // Check if user can update the status
  const canUpdateStatus = schedule.assignedTo?.id === user?.id || user?.role === 'supervisor';
  
  // Determine what actions are available based on status
  const getAvailableActions = () => {
    if (!canUpdateStatus) return [];
    
    switch (schedule.status) {
      case 'pending':
        return [
          {
            icon: <PlayCircle size={20} color={colors.white} />,
            title: 'Start Inspection',
            onPress: () => handleUpdateStatus('in-progress'),
            variant: 'primary' as const,
          },
          {
            icon: <XCircle size={20} color={colors.error[500]} />,
            title: 'Cancel',
            onPress: () => handleUpdateStatus('canceled'),
            variant: 'outline' as const,
            textColor: colors.error[500],
          }
        ];
      case 'in-progress':
        return [
          {
            icon: <CheckCircle size={20} color={colors.white} />,
            title: 'Mark as Completed',
            onPress: () => handleUpdateStatus('completed'),
            variant: 'primary' as const,
          },
          {
            icon: <XCircle size={20} color={colors.error[500]} />,
            title: 'Cancel',
            onPress: () => handleUpdateStatus('canceled'),
            variant: 'outline' as const,
            textColor: colors.error[500],
          }
        ];
      default:
        return [];
    }
  };
  
  const actions = getAvailableActions();
  
  return (
    <>
      <Stack.Screen options={{
        headerShown: false,
      }} />
      <StyledView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={themeColors.text} />
          </TouchableOpacity>
          <StyledText size="xl" weight="bold">
            Inspection Details
          </StyledText>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Coach Image */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: schedule.coach.image || 'https://images.pexels.com/photos/5857862/pexels-photo-5857862.jpeg' }} 
              style={styles.coachImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <View style={styles.statusContainer}>
                <StatusBadge status={schedule.status} size="lg" />
              </View>
            </View>
          </View>
          
          {/* Coach Information */}
          <View style={styles.infoSection}>
            <StyledText size="2xl" weight="bold">
              Coach {schedule.coach.number}
            </StyledText>
            
            <StyledText size="md" color={themeColors.textSecondary} style={styles.coachType}>
              {schedule.coach.type} | {schedule.coach.division} Division
            </StyledText>
            
            <View style={styles.inspectionTypeContainer}>
              <View 
                style={[
                  styles.inspectionTypeBadge, 
                  { backgroundColor: colors.secondary[500] }
                ]}
              >
                <StyledText size="xs" weight="bold" color={colors.white}>
                  {schedule.inspectionType.toUpperCase()} INSPECTION
                </StyledText>
              </View>
              
              <View 
                style={[
                  styles.priorityBadge, 
                  { 
                    backgroundColor: 
                      schedule.priority === 'high' ? colors.error[500] :
                      schedule.priority === 'medium' ? colors.warning[500] :
                      colors.success[500]
                  }
                ]}
              >
                <StyledText size="xs" weight="bold" color={colors.white}>
                  {schedule.priority.toUpperCase()} PRIORITY
                </StyledText>
              </View>
            </View>
          </View>
          
          {/* Schedule Details */}
          <Card style={styles.detailsCard}>
            <View style={styles.detailsRow}>
              <View style={styles.detailIcon}>
                <Calendar size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.detailContent}>
                <StyledText size="sm" color={themeColors.textSecondary}>
                  Scheduled Date
                </StyledText>
                <StyledText size="md">
                  {formatDate(schedule.scheduledDate)}
                </StyledText>
              </View>
            </View>
            
            {schedule.completedDate && (
              <View style={styles.detailsRow}>
                <View style={styles.detailIcon}>
                  <Clock size={20} color={colors.success[500]} />
                </View>
                <View style={styles.detailContent}>
                  <StyledText size="sm" color={themeColors.textSecondary}>
                    Completed Date
                  </StyledText>
                  <StyledText size="md">
                    {formatDate(schedule.completedDate)}
                  </StyledText>
                </View>
              </View>
            )}
            
            <View style={styles.detailsRow}>
              <View style={styles.detailIcon}>
                <MapPin size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.detailContent}>
                <StyledText size="sm" color={themeColors.textSecondary}>
                  Location
                </StyledText>
                <StyledText size="md">
                  {schedule.location}
                </StyledText>
              </View>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailIcon}>
                <User size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.detailContent}>
                <StyledText size="sm" color={themeColors.textSecondary}>
                  Assigned To
                </StyledText>
                <StyledText size="md">
                  {schedule.assignedTo?.name || 'Unassigned'}
                </StyledText>
              </View>
            </View>
            
            {schedule.supervisedBy && (
              <View style={styles.detailsRow}>
                <View style={styles.detailIcon}>
                  <User size={20} color={colors.secondary[500]} />
                </View>
                <View style={styles.detailContent}>
                  <StyledText size="sm" color={themeColors.textSecondary}>
                    Supervised By
                  </StyledText>
                  <StyledText size="md">
                    {schedule.supervisedBy.name}
                  </StyledText>
                </View>
              </View>
            )}
          </Card>
          
          {/* Notes */}
          {schedule.notes && (
            <Card style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <FileText size={20} color={colors.primary[500]} />
                <StyledText size="md" weight="bold" style={styles.notesTitle}>
                  Notes
                </StyledText>
              </View>
              <StyledText size="md" style={styles.notesContent}>
                {schedule.notes}
              </StyledText>
            </Card>
          )}
          
          {/* Action Buttons */}
          {actions.length > 0 && (
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  title={action.title}
                  onPress={action.onPress}
                  variant={action.variant}
                  icon={action.icon}
                  iconPosition="left"
                  style={styles.actionButton}
                  textStyle={action.textColor ? { color: action.textColor } : undefined}
                />
              ))}
            </View>
          )}
          
          {/* Additional Actions */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryAction}>
              <Share2 size={20} color={themeColors.text} />
              <StyledText size="sm" style={styles.secondaryActionText}>
                Share
              </StyledText>
            </TouchableOpacity>
            
            {(user?.role === 'supervisor' || schedule.status === 'in-progress') && (
              <TouchableOpacity style={styles.secondaryAction}>
                <FileEdit size={20} color={themeColors.text} />
                <StyledText size="sm" style={styles.secondaryActionText}>
                  Edit
                </StyledText>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </StyledView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  goBackButton: {
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  coachImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  infoSection: {
    padding: 16,
  },
  coachType: {
    marginTop: 4,
  },
  inspectionTypeContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  inspectionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  notesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesTitle: {
    marginLeft: 8,
  },
  notesContent: {
    paddingLeft: 28,
  },
  actionsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    paddingTop: 0,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 8,
  },
  secondaryActionText: {
    marginLeft: 8,
  },
});