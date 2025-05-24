import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StyledText, Card, Button, Badge } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { generateTripReport } from '@/utils/pdfGenerator';

interface ReportCardProps {
  report: {
    id: string;
    train_number: string;
    train_name?: string;
    date: string;
    location: string;
    status: string;
    created_at: string;
    submitted_at?: string | null;
    inspector_id?: string;
    stats?: {
      total_activities: number;
      checked_okay: number;
      checked_not_okay: number;
      unchecked: number;
    };
    trip_activity_results?: any[];
  };
  onDelete: (reportId: string) => Promise<void>;
  showInspectorName?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onDelete,
  showInspectorName = false,
}) => {
  const { colors } = useTheme();
  const router = useRouter();

  const getStatusColor = (status: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (status) {
      case 'submitted':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const handleViewReport = () => {
    router.push(`/trips?tripId=${report.id}`);
  };

  const handleGeneratePdf = async () => {
    try {
      await generateTripReport(report.id);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  const handleDeleteReport = () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(report.id);
              Alert.alert('Success', 'Report deleted successfully');
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Failed to delete report. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <StyledText style={styles.trainNumber}>
            {report.train_number || 'Unknown Train'}
          </StyledText>
          {report.train_name && (
            <StyledText style={styles.trainName}>
              {report.train_name}
            </StyledText>
          )}
        </View>
        <Badge
          text={getStatusText(report.status)}
          variant={getStatusColor(report.status)}
        />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#555555" />
          <StyledText style={styles.detailText}>{report.date}</StyledText>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#555555" />
          <StyledText style={styles.detailText}>{report.location}</StyledText>
        </View>
        
        {showInspectorName && report.inspector_id && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#555555" />
            <StyledText style={styles.detailText}>Inspector ID: {report.inspector_id}</StyledText>
          </View>
        )}
        
        {report.submitted_at && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#555555" />
            <StyledText style={styles.detailText}>
              Submitted: {report.submitted_at}
            </StyledText>
          </View>
        )}
        
        {report.stats && (
          <View style={styles.statsContainer}>
            <StyledText style={styles.statsTitle}>Inspection Status:</StyledText>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <StyledText style={[styles.statValue, {color: '#4caf50'}]}>{report.stats.checked_okay}</StyledText>
                <StyledText style={styles.statLabel}>OK</StyledText>
              </View>
              <View style={styles.statItem}>
                <StyledText style={[styles.statValue, {color: '#f44336'}]}>{report.stats.checked_not_okay}</StyledText>
                <StyledText style={styles.statLabel}>Not OK</StyledText>
              </View>
              <View style={styles.statItem}>
                <StyledText style={[styles.statValue, {color: '#9e9e9e'}]}>{report.stats.unchecked}</StyledText>
                <StyledText style={styles.statLabel}>Pending</StyledText>
              </View>
              <View style={styles.statItem}>
                <StyledText style={[styles.statValue, {color: '#2196f3'}]}>{report.stats.total_activities}</StyledText>
                <StyledText style={styles.statLabel}>Total</StyledText>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <Button
          title="View"
          size="sm"
          onPress={handleViewReport}
          icon={<Ionicons name="eye-outline" size={16} color={colors.white} />}
          style={styles.actionButton}
        />
        
        <Button
          title="PDF"
          size="sm"
          variant="outline"
          onPress={handleGeneratePdf}
          icon={<Ionicons name="document-outline" size={16} color="#0056b3" />}
          style={styles.actionButton}
        />
        
        {report.status === 'draft' && (
          <Button
            title="Delete"
            size="sm"
            variant="outline"
            onPress={handleDeleteReport}
            icon={<Ionicons name="trash-outline" size={16} color="#d32f2f" />}
            style={styles.actionButton}
            textStyle={{ color: '#d32f2f' }}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  trainNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trainName: {
    fontSize: 14,
    opacity: 0.8,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  statsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
    marginRight: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    marginRight: 8,
    minWidth: 90,
  },
});
