import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { StyledText, Card, Button } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import { 
  generateTripReport, 
  validateReportForGeneration,
  getReportStats,
  previewReportHtml,
  clearGenerationCache
} from '@/utils/pdfGenerator';
import { getCacheStats } from '@/utils/reportDataService';

interface ReportGenerationTestProps {
  reportId?: string;
}

export const ReportGenerationTest: React.FC<ReportGenerationTestProps> = ({
  reportId = '717505b1-3849-48b9-a665-7afec889543e' // Default test report ID
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testValidation = async () => {
    setLoading(true);
    addResult('🔍 Testing report validation...');
    
    try {
      const validation = await validateReportForGeneration(reportId);
      addResult(`✅ Validation complete - Valid: ${validation.isValid}`);
      addResult(`📋 Issues: ${validation.issues.length}, Warnings: ${validation.warnings.length}`);
      
      if (validation.issues.length > 0) {
        addResult(`❌ Issues: ${validation.issues.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        addResult(`⚠️ Warnings: ${validation.warnings.join(', ')}`);
      }
    } catch (error: any) {
      addResult(`❌ Validation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testStats = async () => {
    setLoading(true);
    addResult('📊 Testing report statistics...');
    
    try {
      const stats = await getReportStats(reportId);
      addResult(`✅ Stats retrieved successfully`);
      addResult(`📈 Total: ${stats.totalActivities}, Completed: ${stats.completedActivities}`);
      addResult(`📏 Estimated size: ${stats.estimatedPdfSize}`);
      addResult(`🎯 Completion: ${stats.completionPercentage}%`);
    } catch (error: any) {
      addResult(`❌ Stats failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGeneration = async () => {
    setLoading(true);
    addResult('🔄 Testing PDF generation...');
    
    try {
      await generateTripReport(reportId, {
        showProgress: false,
        includeQRCode: false,
        customTemplate: false,
        emailAfterGeneration: false,
        saveToDevice: true
      }, (progress) => {
        addResult(`📈 ${progress.stage}: ${progress.progress}% - ${progress.message}`);
      });
      
      addResult('✅ PDF generation completed successfully!');
    } catch (error: any) {
      addResult(`❌ PDF generation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPreview = async () => {
    setLoading(true);
    addResult('👀 Testing HTML preview...');
    
    try {
      const html = await previewReportHtml(reportId);
      const htmlSize = (html.length / 1024).toFixed(2);
      addResult(`✅ HTML preview generated (${htmlSize} KB)`);
      addResult(`📄 Contains ${html.split('<tr>').length - 1} table rows`);
    } catch (error: any) {
      addResult(`❌ HTML preview failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCache = async () => {
    setLoading(true);
    addResult('🗄️ Testing cache system...');
    
    try {
      const cacheStats = getCacheStats();
      addResult(`📊 Cache size: ${cacheStats.size} items`);
      addResult(`🔑 Cached reports: ${cacheStats.keys.length}`);
      
      await clearGenerationCache();
      addResult('🧹 Cache cleared successfully');
      
      const newCacheStats = getCacheStats();
      addResult(`📊 New cache size: ${newCacheStats.size} items`);
    } catch (error: any) {
      addResult(`❌ Cache test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult('🚀 Starting comprehensive test suite...');
    
    await testValidation();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testStats();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testPreview();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testCache();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Skip actual PDF generation in full test to avoid spam
    addResult('✅ All tests completed! (PDF generation skipped in full test)');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card style={styles.container}>
      <StyledText size="lg" weight="bold" style={styles.title}>
        📋 Report Generation Test Suite
      </StyledText>
      
      <StyledText size="sm" color={colors.textSecondary} style={styles.subtitle}>
        Test ID: {reportId}
      </StyledText>

      <View style={styles.buttonGrid}>
        <Button
          title="Validate"
          size="sm"
          onPress={testValidation}
          disabled={loading}
          style={styles.testButton}
        />
        
        <Button
          title="Stats"
          size="sm"
          onPress={testStats}
          disabled={loading}
          style={styles.testButton}
        />
        
        <Button
          title="Preview"
          size="sm"
          onPress={testPreview}
          disabled={loading}
          style={styles.testButton}
        />
        
        <Button
          title="Generate PDF"
          size="sm"
          onPress={testGeneration}
          disabled={loading}
          style={styles.testButton}
        />
        
        <Button
          title="Cache"
          size="sm"
          onPress={testCache}
          disabled={loading}
          style={styles.testButton}
        />
        
        <Button
          title="Run All"
          size="sm"
          variant="primary"
          onPress={runAllTests}
          disabled={loading}
          style={styles.testButton}
        />
      </View>

      <View style={styles.controls}>
        <Button
          title="Clear Results"
          size="sm"
          variant="outline"
          onPress={clearResults}
          disabled={loading}
        />
      </View>

      <View style={styles.results}>
        <StyledText size="md" weight="semibold" style={styles.resultsTitle}>
          Test Results:
        </StyledText>
        
        {testResults.length === 0 ? (
          <StyledText size="sm" color={colors.textSecondary} style={styles.noResults}>
            No tests run yet. Click a button above to start testing.
          </StyledText>
        ) : (
          testResults.map((result, index) => (
            <StyledText 
              key={index} 
              size="xs" 
              style={styles.resultItem}
              color={result.includes('❌') ? '#EF4444' : 
                     result.includes('⚠️') ? '#F59E0B' :
                     result.includes('✅') ? '#22C55E' : 
                     '#374151'}
            >
              {result}
            </StyledText>
          ))
        )}
      </View>
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
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  testButton: {
    width: '48%',
    marginBottom: 8,
  },
  controls: {
    marginBottom: 16,
    alignItems: 'center',
  },
  results: {
    maxHeight: 300,
  },
  resultsTitle: {
    marginBottom: 8,
  },
  noResults: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultItem: {
    marginBottom: 4,
    fontFamily: 'monospace',
  },
}); 