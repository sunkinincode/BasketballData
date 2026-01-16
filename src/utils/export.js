export const exportToCSV = (data, filename = 'athletes.csv') => {
  if (!data || data.length === 0) {
    return
  }

  // Get headers from the first object
  const headers = Object.keys(data[0])
  
  // Map status values to Thai
  const statusMap = {
    'Starter': 'ผู้เล่นตัวจริง',
    'Substitute': 'ตัวสำรอง',
    'Not Selected': 'ไม่ถูกเลือก',
    null: 'ยังไม่ระบุ',
    '': 'ยังไม่ระบุ'
  }

  // Create CSV content
  const csvHeaders = ['ชื่อ', 'ชื่อเล่น', 'รหัสนักศึกษา', 'ชั้นปี', 'หลักสูตร', 'กีฬา', 'สถานะ', 'มีรูปภาพ']
  const csvRows = data.map(row => {
    const status = statusMap[row.status] || row.status || 'ยังไม่ระบุ'
    const hasImage = row.image_url ? 'ใช่' : 'ไม่'
    return [
      `"${row.name || ''}"`,
      `"${row.nickname || ''}"`,
      `"${row.student_id || ''}"`,
      `"${row.year_of_study || ''}"`,
      `"${row.curriculum || ''}"`,
      `"${row.sport || 'บาสเกตบอล'}"`,
      `"${status}"`,
      `"${hasImage}"`
    ].join(',')
  })

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows
  ].join('\n')

  // Add BOM for UTF-8 to support Thai characters in Excel
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
