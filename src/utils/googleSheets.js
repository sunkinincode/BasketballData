/**
 * Google Sheets Export Utility
 * 
 * This function exports athlete data to a Google Sheet.
 * Column mapping:
 * - Column A: student_id
 * - Column B: name (Full Name)
 * - Column C: phone_number
 * 
 * Note: This requires a backend API endpoint to handle Google Sheets API authentication.
 * See README.md for setup instructions.
 */

const GOOGLE_SHEET_ID = '1PT5o8oBy0XIrKxkYEFz-_vKi8CV4o2b1pi4FrfeFxZg'

/**
 * Export athletes data to Google Sheets
 * @param {Array} athletes - Array of athlete objects
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const exportToGoogleSheets = async (athletes) => {
  if (!athletes || athletes.length === 0) {
    return {
      success: false,
      message: 'ไม่มีข้อมูลให้ส่งออก'
    }
  }

  try {
    // Prepare data according to column mapping
    // Column A: student_id, Column B: name, Column C: phone_number
    const values = athletes.map(athlete => [
      athlete.student_id || '',
      athlete.name || '',
      athlete.phone_number || ''
    ])

    // Check if we have a backend API endpoint configured
    const apiEndpoint = import.meta.env.VITE_GOOGLE_SHEETS_API_URL

    if (!apiEndpoint) {
      // Fallback: Show instructions if API endpoint is not configured
      console.warn('Google Sheets API endpoint not configured. Please set VITE_GOOGLE_SHEETS_API_URL in .env')
      return {
        success: false,
        message: 'กรุณาตั้งค่า Google Sheets API endpoint ในไฟล์ .env (ดูคำแนะนำใน README.md)'
      }
    }

    // Call backend API endpoint
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetId: GOOGLE_SHEET_ID,
        values: values,
        range: 'Sheet1!A:C' // Append to columns A, B, C
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'เกิดข้อผิดพลาด' }))
      throw new Error(errorData.message || 'ไม่สามารถส่งข้อมูลไปยัง Google Sheets ได้')
    }

    const result = await response.json()
    return {
      success: true,
      message: 'ส่งข้อมูลไปยัง Google Sheets สำเร็จ'
    }
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error)
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Google Sheets'
    }
  }
}

/**
 * Alternative: Direct Google Sheets API call (requires OAuth or service account)
 * This is a placeholder - implement based on your authentication method
 */
export const exportToGoogleSheetsDirect = async (athletes) => {
  // This is a placeholder function
  // For production, you'll need to:
  // 1. Set up Google OAuth 2.0 or Service Account
  // 2. Use googleapis library (requires Node.js backend)
  // 3. Or use Google Sheets API v4 with proper authentication
  
  console.log('Direct Google Sheets export - requires backend implementation')
  console.log('Sheet ID:', GOOGLE_SHEET_ID)
  console.log('Data to export:', athletes.map(a => ({
    student_id: a.student_id,
    name: a.name,
    phone_number: a.phone_number
  })))
  
  return {
    success: false,
    message: 'ฟังก์ชันนี้ต้องการการตั้งค่า Google Sheets API (ดูคำแนะนำใน README.md)'
  }
}
