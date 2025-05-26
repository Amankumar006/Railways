import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { StyledText, Card, Button } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import { 
  checkDataIntegrity, 
  fixDataIntegrityIssues, 
  getDataIntegritySummary 
} from '@/utils/dataIntegrityChecker';

interface IntegrityIssue {
  type: 'missing_profile' | 'orphaned_report';
  reportId: string;
  inspectorId: string;
  details: string;
}

interface IntegritySummary {
  totalReports: number;
  totalProfiles: number;
  issues: IntegrityIssue[];
  isHealthy: boolean;
}

export const DataIntegrityChecker: React.FC = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<IntegritySummary | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkIntegrity = async () => {
    setLoading(true);
    try {
      const summaryData = await getDataIntegritySummary();
      setSummary(summaryData);
      setLastChecked(new Date());
      
      if (summaryData.isHealthy) {
        Alert.alert('✅ Data Integrity Check', 'No issues found! Your database is healthy.');
      } else {
        Alert.alert(
          '⚠️ Data Integrity Issues Found', 
          `Found ${summaryData.issues.length} issues that need attention.`
        );
      }
    } catch (error: any) {
      console.error('Error checking data integrity:', error);
      Alert.alert('Error', 'Failed to check data integrity: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fixIssues = async () => {
    if (!summary || summary.issues.length === 0) {
      Alert.alert('No Issues', 'No data integrity issues to fix.');
      return;
    }

    Alert.alert(
      'Fix Data Integrity Issues',
      `This will create ${summary.issues.length} missing profiles. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Fix Issues', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await fixDataIntegrityIssues();
              Alert.alert('✅ Success', 'Data integrity issues have been fixed!');
              // Refresh the summary
              await checkIntegrity();
            } catch (error: any) {
              console.error('Error fixing data integrity:', error);
              Alert.alert('Error', 'Failed to fix issues: ' + error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? '#22C55E' : '#EF4444';
  };

  const getStatusText = (isHealthy: boolean) => {
    return isHealthy ? 'Healthy' : 'Issues Found';
  };

  return (
    <Card style={styles.container}>
      <StyledText size="lg" weight="bold" style={styles.title}>
        🔍 Data Integrity Checker
      </StyledText>
      
      <StyledText size="sm" color={colors.textSecondary} style={styles.subtitle}>
        Check for missing profiles and orphaned reports
      </StyledText>

      <View style={styles.buttonContainer}>
        <Button
          title="Check Integrity"
          onPress={checkIntegrity}
          loading={loading}
          style={styles.button}
        />
        
        {summary && !summary.isHealthy && (
          <Button
            title="Fix Issues"
            variant="secondary"
            onPress={fixIssues}
            loading={loading}
            style={styles.button}
          />
        )}
      </View>

      {summary && (
        <View style={styles.summaryContainer}>
          <StyledText size="md" weight="semibold" style={styles.summaryTitle}>
            Database Summary:
          </StyledText>
          
          <View style={styles.summaryRow}>
            <StyledText size="sm">Total Reports:</StyledText>
            <StyledText size="sm" weight="bold">{summary.totalReports}</StyledText>
          </View>
          
          <View style={styles.summaryRow}>
            <StyledText size="sm">Total Profiles:</StyledText>
            <StyledText size="sm" weight="bold">{summary.totalProfiles}</StyledText>
          </View>
          
          <View style={styles.summaryRow}>
            <StyledText size="sm">Status:</StyledText>
            <StyledText 
              size="sm" 
              weight="bold" 
              style={{ color: getStatusColor(summary.isHealthy) }}
            >
              {getStatusText(summary.isHealthy)}
            </StyledText>
          </View>
          
          {summary.issues.length > 0 && (
            <View style={styles.issuesContainer}>
              <StyledText size="sm" weight="semibold" style={styles.issuesTitle}>
                Issues Found ({summary.issues.length}):
              </StyledText>
              
              {summary.issues.slice(0, 5).map((issue, index) => (
                <View key={index} style={styles.issueItem}>
                  <StyledText size="xs" color="#EF4444">
                    • {issue.type === 'missing_profile' ? 'Missing Profile' : 'Orphaned Report'}
                  </StyledText>
                  <StyledText size="xs" color={colors.textSecondary}>
                    Inspector: {issue.inspectorId.slice(0, 8)}...
                  </StyledText>
                </View>
              ))}
              
              {summary.issues.length > 5 && (
                <StyledText size="xs" color={colors.textSecondary} style={styles.moreIssues}>
                  ... and {summary.issues.length - 5} more issues
                </StyledText>
              )}
            </View>
          )}
        </View>
      )}

      {lastChecked && (
        <StyledText size="xs" color={colors.textSecondary} style={styles.lastChecked}>
          Last checked: {lastChecked.toLocaleTimeString()}
        </StyledText>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  summaryContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  summaryTitle: {
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  issuesContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  issuesTitle: {
    marginBottom: 8,
    color: '#EF4444',
  },
  issueItem: {
    marginBottom: 4,
  },
  moreIssues: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  lastChecked: {
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 