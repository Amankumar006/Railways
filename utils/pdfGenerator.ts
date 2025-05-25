import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { fetchTripReportData } from './reportDataService';
import { generateReportTemplate } from './reportTemplateGenerator';

/**
 * Refactored PDF Generator utility with improved separation of concerns
 */

/**
 * Generate and share a PDF report for a trip
 */
export async function generateTripReport(reportId: string): Promise<void> {
  try {
    // Show loading message
    if (Platform.OS !== 'web') {
      Alert.alert('Generating Report', 'Please wait while we generate your report...');
    }
    
    // Fetch all report data
    const reportData = await fetchTripReportData(reportId);
    
    if (!reportData) {
      if (Platform.OS === 'web') {
        console.error('Failed to load report data');
      } else {
        Alert.alert('Error', 'Failed to load report data. Please try again.');
      }
      return;
    }
    
    // Generate HTML content
    const htmlContent = generateReportTemplate(reportData);
    
    if (Platform.OS === 'web') {
      try {
        // For web, generate PDF using print API
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: true
        });

        // Create a download link
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${uri}`;
        link.download = `Trip_Report_${reportId}.pdf`;
        
        // Append to document, click and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return;
      } catch (error) {
        console.error('Error generating PDF for web:', error);
        
        // Fallback to direct HTML download if PDF generation fails
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Trip_Report_${reportId}.html`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      return;
    }
    
    // For mobile platforms, use expo-print
    console.log('Generating PDF for report:', reportId);
    
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });
    
    console.log('PDF generated at:', uri);
    
    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (isSharingAvailable) {
      // Share the file
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Trip Report',
        UTI: 'com.adobe.pdf'
      });
    } else {
      // If sharing is not available, save to downloads
      const fileName = `Trip_Report_${reportId}.pdf`;
      const downloadPath = FileSystem.documentDirectory + fileName;
      
      await FileSystem.copyAsync({
        from: uri,
        to: downloadPath
      });
      
      Alert.alert(
        'Report Generated', 
        `Report saved to ${downloadPath}`
      );
    }
  } catch (error) {
    console.error('Error generating trip report:', error);
    if (Platform.OS !== 'web') {
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    }
  }
}

/**
 * Preview a report in HTML format (for debugging)
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
