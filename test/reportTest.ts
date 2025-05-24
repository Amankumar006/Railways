import { fetchTripReportData } from '../utils/reportDataService';

async function testFetchReport() {
  try {
    const reportId = '717505b1-3849-48b9-a665-7afec889543e';  // Actual report ID from logs
    console.log('Fetching report:', reportId);
    
    const report = await fetchTripReportData(reportId);
    if (report) {
      console.log('Report fetched successfully:');
      console.log('Train:', report.train_number, report.train_name);
      console.log('Location:', report.location);
      console.log('Inspector:', report.inspector);
      console.log('Stats:', report.stats);
      console.log('Number of sections:', report.sections?.length || 0);
      console.log('Number of activity results:', report.trip_activity_results?.length || 0);
    } else {
      console.log('Report not found');
    }
  } catch (error) {
    console.error('Error fetching report:', error);
  }
}

// Run the test
testFetchReport(); 