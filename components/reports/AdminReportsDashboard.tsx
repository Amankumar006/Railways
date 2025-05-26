import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { StyledText, Card, Button, Badge } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { 
  generateTripReport, 
  generateBulkReports, 
  validateReportForGeneration,
  getReportStats,
  clearGenerationCache
} from '@/utils/pdfGenerator';
import { useReportsData } from '@/hooks/useReportsData';
import { logError } from '@/utils/logger';
import { showError, showSuccess, showConfirmation } from '@/utils/errorHandler';

interface AdminReportsDashboardProps {
  onReportSelect?: (reportId: string) => void;
}

interface BulkOperationProgress {
  total: number;
  completed: number;
  currentReport?: string;
  successful: string[];
  failed: { id: string; error: string }[];
}

export const AdminReportsDashboard: React.FC<AdminReportsDashboardProps> = ({
  onReportSelect
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [bulkOperationProgress, setBulkOperationProgress] = useState<BulkOperationProgress | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [reportStats, setReportStats] = useState<Map<string, any>>(new Map());
  
  const {
    reports,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    filterStatus,
    setFilterStatus,
    deleteReport
  } = useReportsData();

  // Load report statistics for visible reports
  useEffect(() => {
    const loadReportStats = async () => {
      const visibleReports = reports.slice(0, 10); // Load stats for first 10 reports
      
      for (const report of visibleReports) {
        try {
          const stats = await getReportStats(report.id);
          setReportStats(prev => new Map(prev.set(report.id, stats)));
        } catch (error) {
          console.warn(`Failed to load stats for report ${report.id}:`, error);
        }
      }
    };

    if (reports.length > 0) {
      loadReportStats();
    }
  }, [reports]);

  // Handle single report selection
  const toggleReportSelection = (reportId: string) => {
    const newSelection = new Set(selectedReports);
    if (newSelection.has(reportId)) {
      newSelection.delete(reportId);
    } else {
      newSelection.add(reportId);
    }
    setSelectedReports(newSelection);
  };

  // Select all visible reports
  const selectAllReports = () => {
    const allIds = new Set(reports.map(report => report.id));
    setSelectedReports(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedReports(new Set());
  };

  // Handle bulk PDF generation
  const handleBulkGeneration = async () => {
    if (selectedReports.size === 0) {
      showError({ message: 'Please select at least one report to generate.' });
      return;
    }

    showConfirmation(
      `Generate PDF reports for ${selectedReports.size} selected reports?`,
      async () => {
        setShowBulkModal(true);
        setBulkOperationProgress({
          total: selectedReports.size,
          completed: 0,
          successful: [],
          failed: []
        });

        try {
          const reportIds = Array.from(selectedReports);
          const result = await generateBulkReports(reportIds, (completed, total, currentReport) => {
            setBulkOperationProgress(prev => prev ? {
              ...prev,
              completed,
              currentReport
            } : null);
          });

          setBulkOperationProgress(prev => prev ? {
            ...prev,
            successful: result.successful,
            failed: result.failed
          } : null);

          // Show completion message
          const successCount = result.successful.length;
          const failCount = result.failed.length;
          
          if (failCount === 0) {
            showSuccess(`Successfully generated ${successCount} PDF reports!`);
          } else {
            Alert.alert(
              'Bulk Generation Complete',
              `Generated: ${successCount}\nFailed: ${failCount}\n\nCheck the details for failed reports.`,
              [{ text: 'OK' }]
            );
          }

        } catch (error) {
          logError('Bulk generation error:', error);
          showError({ message: 'Failed to complete bulk generation. Please try again.' });
        }
      },
      undefined,
      'Bulk Generate PDFs'
    );
  };

  // Handle single report generation with validation
  const handleSingleGeneration = async (reportId: string) => {
    try {
      // Validate report first
      const validation = await validateReportForGeneration(reportId);
      
      if (!validation.isValid) {
        Alert.alert(
          'Report Validation Failed',
          `Cannot generate PDF:\n${validation.issues.join('\n')}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        Alert.alert(
          'Report Warnings',
          `The following issues were found:\n${validation.warnings.join('\n')}\n\nDo you want to continue?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => generateSingleReport(reportId)
            }
          ]
        );
        return;
      }

      await generateSingleReport(reportId);
    } catch (error) {
      logError('Error in single generation:', error);
      showError({ message: 'Failed to generate report. Please try again.' });
    }
  };

  // Generate single report
  const generateSingleReport = async (reportId: string) => {
    try {
      await generateTripReport(reportId, {
        showProgress: true,
        includeQRCode: false,
        customTemplate: false,
        emailAfterGeneration: false,
        saveToDevice: true
      });
      
      showSuccess('Report generated successfully!');
    } catch (error: any) {
      logError('Error generating single report:', error);
      
      let errorMessage = 'Failed to generate PDF report. Please try again.';
      if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to access this report.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showError({ message: errorMessage });
    }
  };

  // Clear caches
  const handleClearCache = async () => {
    showConfirmation(
      'Clear all report generation caches? This will free up storage space.',
      async () => {
        try {
          await clearGenerationCache();
          showSuccess('Cache cleared successfully!');
        } catch (error) {
          logError('Error clearing cache:', error);
          showError({ message: 'Failed to clear cache. Please try again.' });
        }
      },
      undefined,
      'Clear Cache'
    );
  };

  // Render report card with enhanced features
  const renderReportCard = ({ item: report }: { item: any }) => {
    const isSelected = selectedReports.has(report.id);
    const stats = reportStats.get(report.id);

    return (
      <Card style={[styles.reportCard, isSelected && styles.selectedCard]}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => onReportSelect?.(report.id)}
        >
          {/* Selection checkbox */}
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleReportSelection(report.id)}
          >
                         <Ionicons
               name={isSelected ? 'checkbox' : 'square-outline'}
               size={24}
               color={isSelected ? '#0077CC' : '#666666'}
             />
          </TouchableOpacity>

          {/* Report info */}
          <View style={styles.reportInfo}>
            <View style={styles.reportHeader}>
              <StyledText weight="bold" size="md">
                Train {report.train_number}
              </StyledText>
              <Badge
                text={report.status}
                variant={getStatusVariant(report.status)}
                size="sm"
              />
            </View>

            <StyledText size="sm" color={colors.textSecondary}>
              {report.location} • {report.date}
            </StyledText>

            {report.inspector?.name && (
              <StyledText size="sm" color={colors.textSecondary}>
                Inspector: {report.inspector.name}
              </StyledText>
            )}

            {/* Statistics */}
            {report.stats && (
              <View style={styles.statsRow}>
                                 <View style={styles.statItem}>
                   <StyledText size="xs" color="#22C55E">
                     ✓ {report.stats.checked_okay}
                   </StyledText>
                 </View>
                 <View style={styles.statItem}>
                   <StyledText size="xs" color="#EF4444">
                     ✗ {report.stats.checked_not_okay}
                   </StyledText>
                 </View>
                 <View style={styles.statItem}>
                   <StyledText size="xs" color="#F59E0B">
                     ⏳ {report.stats.unchecked}
                   </StyledText>
                 </View>
                {stats && (
                  <View style={styles.statItem}>
                    <StyledText size="xs" color={colors.textSecondary}>
                      ~{stats.estimatedPdfSize}
                    </StyledText>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="PDF"
              size="sm"
              variant="outline"
                             icon={<Ionicons name="document-text-outline" size={16} color="#0077CC" />}
              onPress={() => handleSingleGeneration(report.id)}
              style={styles.actionButton}
            />
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  // Get status variant for badge
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'submitted': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'neutral';
    }
  };

  // Render bulk operation modal
  const renderBulkModal = () => (
    <Modal
      visible={showBulkModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowBulkModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent}>
          <StyledText size="lg" weight="bold" style={styles.modalTitle}>
            Bulk PDF Generation
          </StyledText>

          {bulkOperationProgress && (
            <View style={styles.progressContainer}>
              <StyledText size="md" style={styles.progressText}>
                Progress: {bulkOperationProgress.completed} / {bulkOperationProgress.total}
              </StyledText>
              
              {bulkOperationProgress.currentReport && (
                <StyledText size="sm" color={colors.textSecondary}>
                  Processing: {bulkOperationProgress.currentReport}
                </StyledText>
              )}

              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                                         { 
                       width: `${(bulkOperationProgress.completed / bulkOperationProgress.total) * 100}%`,
                       backgroundColor: '#0077CC'
                     }
                  ]} 
                />
              </View>

              {bulkOperationProgress.completed === bulkOperationProgress.total && (
                <View style={styles.resultsContainer}>
                                     <StyledText size="sm" color="#22C55E">
                     ✓ Successful: {bulkOperationProgress.successful.length}
                   </StyledText>
                   <StyledText size="sm" color="#EF4444">
                     ✗ Failed: {bulkOperationProgress.failed.length}
                   </StyledText>
                </View>
              )}
            </View>
          )}

          <View style={styles.modalActions}>
            <Button
              title="Close"
              variant="outline"
              onPress={() => {
                setShowBulkModal(false);
                setBulkOperationProgress(null);
                clearSelection();
              }}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header with bulk actions */}
      <View style={styles.header}>
        <StyledText size="lg" weight="bold">
          Reports Dashboard
        </StyledText>
        
        <View style={styles.headerActions}>
          <Button
            title="Clear Cache"
            size="sm"
            variant="outline"
            icon={<Ionicons name="trash-outline" size={16} />}
            onPress={handleClearCache}
            style={styles.headerButton}
          />
        </View>
      </View>

      {/* Selection controls */}
      {selectedReports.size > 0 && (
        <View style={styles.selectionControls}>
          <StyledText size="sm">
            {selectedReports.size} selected
          </StyledText>
          
          <View style={styles.selectionActions}>
            <Button
              title="Generate PDFs"
              size="sm"
              icon={<Ionicons name="download-outline" size={16} />}
              onPress={handleBulkGeneration}
              style={styles.bulkButton}
            />
            
            <Button
              title="Clear"
              size="sm"
              variant="outline"
              onPress={clearSelection}
              style={styles.clearButton}
            />
          </View>
        </View>
      )}

      {/* Quick selection */}
      <View style={styles.quickActions}>
        <Button
          title="Select All"
          size="sm"
          variant="outline"
          onPress={selectAllReports}
          disabled={reports.length === 0}
        />
      </View>

      {/* Reports list */}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportCard}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={isLoading}
        onRefresh={refetch}
      />

      {/* Bulk operation modal */}
      {renderBulkModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 8,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  selectionActions: {
    flexDirection: 'row',
  },
  bulkButton: {
    marginRight: 8,
  },
  clearButton: {
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  reportCard: {
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: '#0077CC',
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    marginRight: 16,
  },
  actions: {
    marginLeft: 12,
  },
  actionButton: {
    minWidth: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
}); 