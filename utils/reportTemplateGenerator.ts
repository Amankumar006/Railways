/**
 * Utility for generating HTML templates for PDF reports
 * Extracted from pdfGenerator.ts to improve separation of concerns
 */

interface ReportTemplateOptions {
  includeHeader?: boolean;
  includeFooter?: boolean;
  includeStyles?: boolean;
}

/**
 * Generate the HTML template for a trip report
 */
export function generateReportTemplate(reportData: any, options: ReportTemplateOptions = {}): string {
  const {
    includeHeader = true,
    includeFooter = true,
    includeStyles = true,
  } = options;

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  // Generate the HTML content
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Trip Inspection Report</title>
      ${includeStyles ? generateStyles() : ''}
    </head>
    <body>
  `;

  // Add header
  if (includeHeader) {
    html += `
      <div class="header">
        <div class="logo">
          <img src="https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Indian_Railways.svg/1200px-Indian_Railways.svg.png" alt="Indian Railways Logo" />
        </div>
        <div class="title">
          <h1>COACH INSPECTION REPORT</h1>
        </div>
      </div>
    `;
  }

  // Add report details
  html += `
    <div class="report-info">
      <table class="info-table">
        <tr>
          <th>Train Number:</th>
          <td>${reportData.train_number || ''}</td>
          <th>Date:</th>
          <td>${formatDate(reportData.date)}</td>
        </tr>
        <tr>
          <th>Location:</th>
          <td>${reportData.location || ''}</td>
          <th>Line No.:</th>
          <td>${reportData.line_no || ''}</td>
        </tr>
        <tr>
          <th>Red On Time:</th>
          <td>${formatTime(reportData.red_on_time) || 'N/A'}</td>
          <th>Red Off Time:</th>
          <td>${formatTime(reportData.red_off_time) || 'N/A'}</td>
        </tr>
        <tr>
          <th>Inspector:</th>
          <td>${reportData.inspector?.name || 'N/A'}</td>
          <th>Submitted:</th>
          <td>${formatDate(reportData.submitted_at) || 'Draft'}</td>
        </tr>
      </table>
    </div>
  `;

  // Add statistics
  if (reportData.stats) {
    const { total_activities, checked_okay, checked_not_okay, unchecked } = reportData.stats;
    const completion = total_activities > 0 
      ? Math.round(((checked_okay + checked_not_okay) / total_activities) * 100) 
      : 0;
    
    html += `
      <div class="stats-section">
        <h2>Inspection Summary</h2>
        <div class="stats-container">
          <div class="stat-box">
            <span class="stat-value">${total_activities}</span>
            <span class="stat-label">Total Items</span>
          </div>
          <div class="stat-box ok-box">
            <span class="stat-value">${checked_okay}</span>
            <span class="stat-label">OK</span>
          </div>
          <div class="stat-box not-ok-box">
            <span class="stat-value">${checked_not_okay}</span>
            <span class="stat-label">Not OK</span>
          </div>
          <div class="stat-box pending-box">
            <span class="stat-value">${unchecked}</span>
            <span class="stat-label">Pending</span>
          </div>
          <div class="stat-box completion-box">
            <span class="stat-value">${completion}%</span>
            <span class="stat-label">Completion</span>
          </div>
        </div>
      </div>
    `;
  }

  // Add inspection sections
  if (reportData.sections && reportData.sections.length > 0) {
    html += `<div class="inspection-content">`;
    
    reportData.sections.forEach((section: any) => {
      html += `
        <div class="section">
          <h2 class="section-header">${section.section_number}. ${section.name}</h2>
      `;
      
      section.categories.forEach((category: any) => {
        html += `
          <div class="category">
            <h3 class="category-header">${category.category_number}. ${category.name}</h3>
            <table class="activities-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Activity</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        category.activities.forEach((activity: any) => {
          const statusClass = activity.check_status === 'checked-okay' 
            ? 'status-ok' 
            : activity.check_status === 'checked-not-okay' 
              ? 'status-not-ok' 
              : 'status-pending';
              
          const statusText = activity.check_status === 'checked-okay' 
            ? 'OK' 
            : activity.check_status === 'checked-not-okay' 
              ? 'Not OK' 
              : 'Pending';
              
          html += `
            <tr>
              <td>${activity.activity_number}</td>
              <td>${activity.activity_text}${activity.is_compulsory ? ' *' : ''}</td>
              <td class="${statusClass}">${statusText}</td>
              <td>${activity.remarks || ''}</td>
            </tr>
          `;
        });
        
        html += `
              </tbody>
            </table>
          </div>
        `;
      });
      
      html += `</div>`;
    });
    
    html += `</div>`;
  } else {
    html += `
      <div class="no-data">
        <p>No inspection data available for this report.</p>
      </div>
    `;
  }

  // Add footer
  if (includeFooter) {
    html += `
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
        <p>Indian Railways Coach Inspection System</p>
      </div>
    `;
  }

  // Close HTML
  html += `
    </body>
    </html>
  `;

  return html;
}

/**
 * Generate CSS styles for the report
 */
function generateStyles(): string {
  return `
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        color: #333;
      }
      
      .header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #0056b3;
        padding-bottom: 10px;
      }
      
      .logo {
        width: 80px;
        margin-right: 20px;
      }
      
      .logo img {
        width: 100%;
        height: auto;
      }
      
      .title {
        flex: 1;
      }
      
      .title h1 {
        margin: 0;
        color: #0056b3;
        font-size: 24px;
      }
      
      .report-info {
        margin-bottom: 20px;
      }
      
      .info-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .info-table th, .info-table td {
        padding: 8px;
        border: 1px solid #ddd;
      }
      
      .info-table th {
        text-align: left;
        background-color: #f5f5f5;
        width: 20%;
      }
      
      .stats-section {
        margin-bottom: 20px;
      }
      
      .stats-section h2 {
        color: #0056b3;
        font-size: 18px;
        margin-bottom: 10px;
      }
      
      .stats-container {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      
      .stat-box {
        background-color: #f5f5f5;
        border-radius: 5px;
        padding: 10px;
        text-align: center;
        width: 18%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .stat-label {
        display: block;
        font-size: 14px;
        color: #666;
      }
      
      .ok-box {
        background-color: #d4edda;
      }
      
      .not-ok-box {
        background-color: #f8d7da;
      }
      
      .pending-box {
        background-color: #fff3cd;
      }
      
      .completion-box {
        background-color: #cce5ff;
      }
      
      .section {
        margin-bottom: 30px;
      }
      
      .section-header {
        background-color: #0056b3;
        color: white;
        padding: 10px;
        margin: 0 0 15px 0;
        font-size: 16px;
        border-radius: 5px;
      }
      
      .category {
        margin-bottom: 20px;
      }
      
      .category-header {
        background-color: #f0f0f0;
        padding: 8px;
        margin: 0 0 10px 0;
        font-size: 14px;
        border-left: 4px solid #0056b3;
      }
      
      .activities-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }
      
      .activities-table th, .activities-table td {
        padding: 8px;
        border: 1px solid #ddd;
        font-size: 12px;
      }
      
      .activities-table th {
        background-color: #f5f5f5;
        text-align: left;
      }
      
      .activities-table th:nth-child(1) {
        width: 8%;
      }
      
      .activities-table th:nth-child(2) {
        width: 52%;
      }
      
      .activities-table th:nth-child(3) {
        width: 10%;
      }
      
      .activities-table th:nth-child(4) {
        width: 30%;
      }
      
      .status-ok {
        background-color: #d4edda;
        color: #155724;
        text-align: center;
      }
      
      .status-not-ok {
        background-color: #f8d7da;
        color: #721c24;
        text-align: center;
      }
      
      .status-pending {
        background-color: #fff3cd;
        color: #856404;
        text-align: center;
      }
      
      .no-data {
        text-align: center;
        padding: 30px;
        background-color: #f8f9fa;
        border-radius: 5px;
        color: #6c757d;
      }
      
      .footer {
        margin-top: 30px;
        padding-top: 10px;
        border-top: 1px solid #ddd;
        font-size: 12px;
        color: #666;
        text-align: center;
      }
      
      .footer p {
        margin: 5px 0;
      }
      
      @media print {
        body {
          padding: 0;
        }
        
        .activities-table {
          page-break-inside: avoid;
        }
        
        .section {
          page-break-inside: avoid;
        }
      }
    </style>
  `;
}
