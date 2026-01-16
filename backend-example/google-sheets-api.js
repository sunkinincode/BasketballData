/**
 * Example Backend API Endpoint for Google Sheets Export
 * 
 * This is an example implementation using Node.js/Express
 * You can adapt this to your preferred backend framework
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install googleapis express cors
 * 2. Set up Google Service Account (see README.md)
 * 3. Place service account JSON key file securely
 */

const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_SHEET_ID = '1PT5o8oBy0XIrKxkYEFz-_vKi8CV4o2b1pi4FrfeFxZg';

// Initialize Google Auth
// Option 1: Use service account key file
const auth = new google.auth.GoogleAuth({
  keyFile: './path/to/service-account-key.json', // Update this path
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Option 2: Use environment variables (more secure)
// const auth = new google.auth.GoogleAuth({
//   credentials: {
//     client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//     private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//   },
//   scopes: ['https://www.googleapis.com/auth/spreadsheets'],
// });

/**
 * POST /api/google-sheets
 * 
 * Request body:
 * {
 *   "sheetId": "1PT5o8oBy0XIrKxkYEFz-_vKi8CV4o2b1pi4FrfeFxZg",
 *   "values": [
 *     ["12345", "สมชาย ใจดี", "0812345678"],
 *     ["12346", "สมหญิง รักดี", "0823456789"]
 *   ],
 *   "range": "Sheet1!A:C"
 * }
 */
app.post('/api/google-sheets', async (req, res) => {
  try {
    const { sheetId, values, range } = req.body;

    if (!values || !Array.isArray(values) || values.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีข้อมูลให้ส่งออก'
      });
    }

    // Authenticate and get sheets client
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Clear existing data (optional - remove if you want to append)
    // await sheets.spreadsheets.values.clear({
    //   spreadsheetId: sheetId,
    //   range: range || 'Sheet1!A:C',
    // });

    // Append new data
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId || GOOGLE_SHEET_ID,
      range: range || 'Sheet1!A:C',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values,
      },
    });

    console.log(`Successfully appended ${values.length} rows to Google Sheet`);

    res.json({
      success: true,
      message: `ส่งข้อมูล ${values.length} แถวไปยัง Google Sheets สำเร็จ`,
      updatedCells: response.data.updates?.updatedCells || 0
    });
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Google Sheets: ' + error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'google-sheets-api' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Google Sheets API server running on port ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/api/google-sheets`);
});

/**
 * Setup Instructions:
 * 
 * 1. Install dependencies:
 *    npm install googleapis express cors
 * 
 * 2. Create Google Service Account:
 *    - Go to Google Cloud Console
 *    - Create a new project or select existing
 *    - Enable Google Sheets API
 *    - Create Service Account
 *    - Download JSON key file
 * 
 * 3. Share Google Sheet with Service Account:
 *    - Open your Google Sheet
 *    - Click Share button
 *    - Add Service Account email (found in JSON key file)
 *    - Give Editor permission
 * 
 * 4. Update the keyFile path in the code above
 * 
 * 5. Set environment variable in frontend .env:
 *    VITE_GOOGLE_SHEETS_API_URL=http://localhost:3000/api/google-sheets
 * 
 * 6. Run the backend server:
 *    node backend-example/google-sheets-api.js
 */
