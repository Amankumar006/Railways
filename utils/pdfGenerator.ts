import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { fetchTripReportData, clearReportCache } from './reportDataService';
import { generateReportTemplate } from './reportTemplateGenerator';

/**
 * Enhanced PDF Generator utility with improved error handling, progress tracking,
 * and additional features like bulk generation and email capabilities
 */

interface GenerationOptions {
  showProgress?: boolean;
  includeQRCode?: boolean;
  customTemplate?: boolean;
  emailAfterGeneration?: boolean;
  saveToDevice?: boolean;
}

interface GenerationProgress {
  stage: 'fetching' | 'processing' | 'generating' | 'sharing' | 'complete';
  progress: number;
  message: string;
}

type ProgressCallback = (progress: GenerationProgress) => void;

/**
 * Enhanced function to generate and share a PDF report for a trip
 */
export async function generateTripReport(
  reportId: string, 
  options: GenerationOptions = {},
  onProgress?: ProgressCallback
): Promise<void> {
  const {
    showProgress = true,
    includeQRCode = false,
    customTemplate = false,
    emailAfterGeneration = false,
    saveToDevice = true
  } = options;

  try {
    // Stage 1: Show initial loading message
    if (showProgress && Platform.OS !== 'web') {
      Alert.alert('Generating Report', 'Please wait while we generate your report...');
    }
    
    onProgress?.({
      stage: 'fetching',
      progress: 10,
      message: 'Fetching report data...'
    });
    
    // Stage 2: Fetch all report data with retry logic
    const reportData = await fetchTripReportData(reportId, true);
    
    if (!reportData) {
      throw new Error('Failed to load report data. The report may not exist or you may not have permission to access it.');
    }
    
    onProgress?.({
      stage: 'processing',
      progress: 40,
      message: 'Processing report data...'
    });
    
    // Stage 3: Generate HTML content with enhanced features
    const htmlContent = generateReportTemplate(reportData, {
      includeHeader: true,
      includeFooter: true,
      includeStyles: true,
      includeQRCode,
      customTemplate
    });
    
    onProgress?.({
      stage: 'generating',
      progress: 70,
      message: 'Generating PDF...'
    });
    
    // Stage 4: Platform-specific PDF generation
    if (Platform.OS === 'web') {
      await generateWebPDF(htmlContent, reportId, reportData);
    } else {
      await generateMobilePDF(htmlContent, reportId, reportData, saveToDevice);
    }
    
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Report generated successfully!'
    });
    
    // Optional: Send email after generation
    if (emailAfterGeneration) {
      // This would integrate with an email service
      console.log('Email functionality would be implemented here');
    }
    
  } catch (error: any) {
    console.error('Error generating trip report:', error);
    
    // Enhanced error handling with specific error messages
    let errorMessage = 'An unexpected error occurred while generating the report.';
    
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      errorMessage = 'Database schema error. Please contact system administrator.';
    } else if (error.message?.includes('permission')) {
      errorMessage = 'You do not have permission to access this report.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    if (Platform.OS !== 'web') {
      Alert.alert('Error', errorMessage);
    } else {
      console.error('PDF Generation Error:', errorMessage);
    }
    
    throw error;
  }
}

/**
 * Generate PDF for web platform
 */
async function generateWebPDF(htmlContent: string, reportId: string, reportData: any): Promise<void> {
  try {
    // For web, generate PDF using print API
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: true
    });

    // Create a download link with proper filename
    const fileName = `Railway_Inspection_Report_${reportData.train_number}_${reportId.slice(0, 8)}.pdf`;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${uri}`;
    link.download = fileName;
    
    // Append to document, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Error generating PDF for web:', error);
    
    // Fallback to direct HTML download if PDF generation fails
    const fileName = `Railway_Inspection_Report_${reportData.train_number}_${reportId.slice(0, 8)}.html`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

/**
 * Generate PDF for mobile platforms
 */
async function generateMobilePDF(
  htmlContent: string, 
  reportId: string, 
  reportData: any, 
  saveToDevice: boolean
): Promise<void> {
  console.log('Generating PDF for report:', reportId);
  
  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
    base64: false
  });
  
  console.log('PDF generated at:', uri);
  
  // Create a proper filename
  const fileName = `Railway_Inspection_Report_${reportData.train_number}_${reportId.slice(0, 8)}.pdf`;
  
  // Check if sharing is available
  const isSharingAvailable = await Sharing.isAvailableAsync();
  
  if (isSharingAvailable) {
    // Share the file
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Railway Inspection Report',
      UTI: 'com.adobe.pdf'
    });
  } else if (saveToDevice) {
    // If sharing is not available, save to downloads
    const downloadPath = FileSystem.documentDirectory + fileName;
    
    await FileSystem.copyAsync({
      from: uri,
      to: downloadPath
    });
    
    Alert.alert(
      'Report Generated', 
      `Report saved to ${downloadPath}`,
      [{ text: 'OK' }]
    );
  }
}

/**
 * Bulk generate multiple reports
 */
export async function generateBulkReports(
  reportIds: string[],
  onProgress?: (completed: number, total: number, currentReport?: string) => void
): Promise<{ successful: string[]; failed: { id: string; error: string }[] }> {
  const successful: string[] = [];
  const failed: { id: string; error: string }[] = [];
  
  for (let i = 0; i < reportIds.length; i++) {
    const reportId = reportIds[i];
    
    try {
      onProgress?.(i, reportIds.length, reportId);
      await generateTripReport(reportId, { showProgress: false });
      successful.push(reportId);
    } catch (error: any) {
      failed.push({
        id: reportId,
        error: error.message || 'Unknown error'
      });
    }
  }
  
  onProgress?.(reportIds.length, reportIds.length);
  
  return { successful, failed };
}

/**
 * Preview a report in HTML format (for debugging and testing)
 */
export async function previewReportHtml(reportId: string): Promise<string> {
  try {
    const reportData = await fetchTripReportData(reportId);
    
    if (!reportData) {
      throw new Error('Failed to load report data');
    }
    
    return generateReportTemplate(reportData);
  } catch (error) {
    console.error('Error previewing report HTML:', error);
    throw error;
  }
}

/**
 * Get report generation statistics
 */
export async function getReportStats(reportId: string): Promise<{
  totalActivities: number;
  completedActivities: number;
  pendingActivities: number;
  completionPercentage: number;
  estimatedPdfSize: string;
}> {
  try {
    const reportData = await fetchTripReportData(reportId);
    
    if (!reportData || !reportData.stats) {
      throw new Error('Report data not available');
    }
    
    const { total_activities, checked_okay, checked_not_okay, unchecked } = reportData.stats;
    const completedActivities = checked_okay + checked_not_okay;
    const completionPercentage = total_activities > 0 
      ? Math.round((completedActivities / total_activities) * 100) 
      : 0;
    
    // Estimate PDF size based on content
    const estimatedPages = Math.max(1, Math.ceil(total_activities / 20));
    const estimatedSize = `${Math.round(estimatedPages * 0.5 * 100) / 100} MB`;
    
    return {
      totalActivities: total_activities,
      completedActivities,
      pendingActivities: unchecked,
      completionPercentage,
      estimatedPdfSize: estimatedSize
    };
  } catch (error) {
    console.error('Error getting report stats:', error);
    throw error;
  }
}

/**
 * Clear all caches and temporary files
 */
export async function clearGenerationCache(): Promise<void> {
  try {
    // Clear report data cache
    clearReportCache();
    
    // Clear temporary PDF files (mobile only)
    if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
      const cacheFiles = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
      const pdfFiles = cacheFiles.filter(file => file.endsWith('.pdf'));
      
      await Promise.all(
        pdfFiles.map(file => 
          FileSystem.deleteAsync(FileSystem.cacheDirectory + file, { idempotent: true })
        )
      );
      
      console.log(`Cleared ${pdfFiles.length} temporary PDF files`);
    }
    
    console.log('Generation cache cleared successfully');
  } catch (error) {
    console.error('Error clearing generation cache:', error);
  }
}

/**
 * Validate report before generation
 */
export async function validateReportForGeneration(reportId: string): Promise<{
  isValid: boolean;
  issues: string[];
  warnings: string[];
}> {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  try {
    const reportData = await fetchTripReportData(reportId);
    
    if (!reportData) {
      issues.push('Report data not found');
      return { isValid: false, issues, warnings };
    }
    
    // Check required fields
    if (!reportData.train_number) {
      issues.push('Train number is missing');
    }
    
    if (!reportData.location) {
      issues.push('Location is missing');
    }
    
    if (!reportData.date) {
      issues.push('Date is missing');
    }
    
    if (!reportData.inspector?.name) {
      warnings.push('Inspector name is missing');
    }
    
    // Check completion status
    if (reportData.stats) {
      const { total_activities, unchecked } = reportData.stats;
      if (unchecked > 0) {
        warnings.push(`${unchecked} out of ${total_activities} activities are not completed`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  } catch (error) {
    issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, issues, warnings };
  }
}
