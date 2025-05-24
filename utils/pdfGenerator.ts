import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { fetchTripReportData } from './reportDataService';
import { generateReportTemplate } from './reportTemplateGenerator';

/**
 * Refactored PDF Generator utility with improved separation of concerns
 */

// Import HTML to PDF converter based on platform
let RNHTMLtoPDF: any;
if (Platform.OS !== 'web') {
  RNHTMLtoPDF = require('react-native-html-to-pdf').default;
}

/**
 * Generate and share a PDF report for a trip
 */
export async function generateTripReport(reportId: string): Promise<void> {
  try {
    // Show loading message
    Alert.alert('Generating Report', 'Please wait while we generate your report...');
    
    // Fetch all report data
    const reportData = await fetchTripReportData(reportId);
    
    if (!reportData) {
      Alert.alert('Error', 'Failed to load report data. Please try again.');
      return;
    }
    
    // Generate HTML content
    const htmlContent = generateReportTemplate(reportData);
    
    // Generate and share PDF based on platform
    if (Platform.OS === 'web') {
      await generatePdfWeb(htmlContent, `Trip_Report_${reportId}`);
    } else {
      await generatePdfNative(htmlContent, `Trip_Report_${reportId}`);
    }
  } catch (error) {
    console.error('Error generating trip report:', error);
    Alert.alert('Error', 'Failed to generate report. Please try again.');
  }
}

/**
 * Generate and share PDF on native platforms (iOS/Android)
 */
async function generatePdfNative(htmlContent: string, fileName: string): Promise<void> {
  try {
    // Generate PDF file
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: 'Documents',
      base64: false
    };
    
    const file = await RNHTMLtoPDF.convert(options);
    
    if (!file || !file.filePath) {
      throw new Error('Failed to generate PDF file');
    }
    
    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (isSharingAvailable) {
      // Share the file
      await Sharing.shareAsync(file.filePath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Trip Report',
        UTI: 'com.adobe.pdf'
      });
    } else {
      // If sharing is not available, save to downloads
      const downloadPath = FileSystem.documentDirectory + fileName + '.pdf';
      await FileSystem.copyAsync({
        from: file.filePath,
        to: downloadPath
      });
      
      Alert.alert(
        'Report Generated', 
        `Report saved to ${downloadPath}`
      );
    }
  } catch (error) {
    console.error('Error in generatePdfNative:', error);
    throw error;
  }
}

/**
 * Generate and share PDF on web platform
 */
async function generatePdfWeb(htmlContent: string, fileName: string): Promise<void> {
  try {
    // Create a hidden iframe to render the HTML
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Write the HTML content to the iframe
    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDocument) {
      throw new Error('Could not access iframe document');
    }
    
    iframeDocument.open();
    iframeDocument.write(htmlContent);
    iframeDocument.close();
    
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Print the iframe content
    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      throw new Error('Could not access iframe window');
    }
    
    printWindow.print();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  } catch (error) {
    console.error('Error in generatePdfWeb:', error);
    throw error;
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
