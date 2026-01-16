import { useState, useEffect } from 'react'

const PDPAModal = () => {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Check if user has already accepted
    const hasAccepted = localStorage.getItem('pdpa_consent_accepted')
    if (!hasAccepted) {
      setShowModal(true)
    }
  }, [])

  const handleAgree = () => {
    localStorage.setItem('pdpa_consent_accepted', 'true')
    setShowModal(false)
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">ประกาศความเป็นส่วนตัว (PDPA)</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-700 leading-relaxed text-base">
            ทางเว็บไซต์จะจัดเก็บข้อมูลโดยคำนึงถึงความปลอดภัยตาม พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) โดยทางเราจะมีการจัดเก็บข้อมูลดังนี้: ชื่อ-นามสกุล, รหัสนักศึกษา, ประเภทกีฬา, สถานะการคัดเลือก, และรูปภาพถ่ายนักกีฬา เพื่อใช้ในการบริหารจัดการทีมและกิจกรรมกีฬาของมหาวิทยาลัยเท่านั้น
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={handleAgree}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-base shadow-sm"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  )
}

export default PDPAModal
