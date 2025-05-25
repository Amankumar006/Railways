import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StyledText, Card, Button, Badge } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { generateTripReport } from '@/utils/pdfGenerator';
import { diagnosticTools } from '@/utils/diagnosticTools';

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
    inspector?: {
      name: string;
    };
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

  // Diagnostic tool for troubleshooting
  const handleDiagnose = async () => {
    await diagnosticTools.showAdvancedDiagnosticAlert(report.id);
  };

  return (
    <Card style={styles.container}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={handleViewReport}
        activeOpacity={0.8}
      >
        {/* Content details */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <StyledText style={styles.trainNumber}>Train {report.train_number}</StyledText>
            {report.train_name && (
              <StyledText style={styles.trainName}>{report.train_name}</StyledText>
            )}
            <Badge 
              text={getStatusText(report.status)} 
              variant={getStatusColor(report.status)}
              size="sm"
            />
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={colors.text}
          />
        </View>
        
        {/* Location and date */}
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <StyledText style={styles.detailText}>{report.location}</StyledText>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <StyledText style={styles.detailText}>{report.date}</StyledText>
          </View>
          {report.submitted_at && (
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.textSecondary} />
              <StyledText style={styles.detailText}>Submitted: {report.submitted_at}</StyledText>
            </View>
          )}
          {showInspectorName && report.inspector && (
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              <StyledText style={styles.detailText}>Inspector: {report.inspector.name}</StyledText>
            </View>
          )}
        </View>
        
        {/* Progress statistics */}
        {report.stats && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <StyledText style={styles.statValue}>{report.stats.checked_okay}</StyledText>
              <StyledText style={styles.statLabel}>OK</StyledText>
            </View>
            <View style={styles.statItem}>
              <StyledText style={styles.statValue}>{report.stats.checked_not_okay}</StyledText>
              <StyledText style={styles.statLabel}>Not OK</StyledText>
            </View>
            <View style={styles.statItem}>
              <StyledText style={styles.statValue}>{report.stats.unchecked}</StyledText>
              <StyledText style={styles.statLabel}>Pending</StyledText>
            </View>
            <View style={styles.statItem}>
              <StyledText style={styles.statValue}>{report.stats.total_activities}</StyledText>
              <StyledText style={styles.statLabel}>Total</StyledText>
            </View>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="PDF"
          size="sm"
          variant="outline"
          icon={<Ionicons name="document-text-outline" size={16} color="#0077CC" />}
          onPress={handleGeneratePdf}
          style={styles.actionButton}
        />
        <Button
          title="Diagnose"
          size="sm"
          variant="outline"
          icon={<Ionicons name="medkit-outline" size={16} color="#F59E0B" />}
          onPress={handleDiagnose}
          style={styles.actionButton}
        />
        <Button
          title="Delete"
          size="sm"
          variant="outline"
          icon={<Ionicons name="trash-outline" size={16} color="#EF4444" />}
          onPress={handleDeleteReport}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
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
  details: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  stats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    marginRight: 8,
    minWidth: 90,
  },
});
