import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PasswordModal from './PasswordModal'
import { exportToCSV } from '../utils/export'

const AdminTab = () => {
  const [authenticated, setAuthenticated] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const ADMIN_PASSWORD = 'adminbas_'

  useEffect(() => {
    // Check if already authenticated in this session
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus === 'true') {
      setAuthenticated(true)
      fetchAthletes()
    } else {
      setShowPasswordModal(true)
    }
  }, [])

  const handlePasswordSuccess = () => {
    sessionStorage.setItem('admin_authenticated', 'true')
    setAuthenticated(true)
    setShowPasswordModal(false)
    fetchAthletes()
  }

  const fetchAthletes = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('athletes')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setAthletes(data || [])
    } catch (err) {
      console.error('Error fetching athletes:', err)
      setError('ไม่สามารถโหลดข้อมูลนักกีฬาได้: ' + (err.message || 'เกิดข้อผิดพลาด'))
    } finally {
      setLoading(false)
    }
  }

  const hasAthletesWithStatus = () => {
    return athletes.some(athlete => 
      athlete.status && 
      athlete.status.trim() !== '' && 
      ['Starter', 'Substitute', 'Not Selected'].includes(athlete.status)
    )
  }

  const handleExport = () => {
    if (athletes.length === 0) {
      setError('ไม่มีข้อมูลให้ส่งออก')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (!hasAthletesWithStatus()) {
      setError('ไม่สามารถส่งออกข้อมูลได้ เนื่องจากยังไม่มีนักกีฬาคนใดถูกระบุสถานะ กรุณาระบุสถานะให้กับนักกีฬาอย่างน้อย 1 คน')
      setTimeout(() => setError(''), 5000)
      return
    }

    exportToCSV(athletes, 'นักกีฬาบาสเกตบอล.csv')
    setSuccess('ส่งออกข้อมูลสำเร็จ')
    setTimeout(() => setSuccess(''), 3000)
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'Starter': 'ผู้เล่นตัวจริง',
      'Substitute': 'ตัวสำรอง',
      'Not Selected': 'ไม่ถูกเลือก',
    }
    return statusMap[status] || 'ยังไม่ระบุ'
  }

  if (!authenticated) {
    return (
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        title="เข้าสู่ระบบผู้ดูแลระบบ"
        password={ADMIN_PASSWORD}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">ข้อมูลนักกีฬาทั้งหมด</h2>
          <button
            onClick={handleExport}
            disabled={loading || athletes.length === 0 || !hasAthletesWithStatus()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={!hasAthletesWithStatus() && athletes.length > 0 ? 'กรุณาระบุสถานะให้กับนักกีฬาอย่างน้อย 1 คน' : ''}
          >
            ส่งออกข้อมูลทั้งหมด
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : athletes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">ไม่มีข้อมูลนักกีฬา</p>
          </div>
        ) : (
          <div className="space-y-4">
            {athletes.map((athlete) => (
              <div
                key={athlete.id}
                className="flex items-center gap-4 border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white"
              >
                {/* Left Side - Text Information */}
                <div className="flex-1 min-w-0">
                  {/* Line 1: Name with Nickname */}
                  <div className="mb-2">
                    <span className="text-lg font-semibold text-gray-800">
                      {athlete.name}
                    </span>
                    {athlete.nickname && (
                      <span className="ml-2 font-bold text-gray-900">
                        ({athlete.nickname})
                      </span>
                    )}
                  </div>
                  
                  {/* Line 2: Student ID */}
                  {athlete.student_id && (
                    <div className="text-sm text-gray-600 mb-1">
                      {athlete.student_id}
                    </div>
                  )}
                  
                  {/* Line 3: Year of Study + Curriculum */}
                  {(athlete.year_of_study || athlete.curriculum) && (
                    <div className="text-sm text-gray-600 mb-1">
                      {athlete.year_of_study && <span>{athlete.year_of_study}</span>}
                      {athlete.year_of_study && athlete.curriculum && <span> </span>}
                      {athlete.curriculum && <span>{athlete.curriculum}</span>}
                    </div>
                  )}
                  
                  {/* Line 4: Phone Number (Admin Only) */}
                  {athlete.phone_number && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">เบอร์โทร:</span> {athlete.phone_number}
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="mt-2">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getStatusLabel(athlete.status)}
                    </span>
                  </div>
                </div>
                
                {/* Right Side - Image */}
                <div className="flex-shrink-0">
                  {athlete.image_url ? (
                    <img
                      src={athlete.image_url}
                      alt={athlete.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-3xl">👤</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminTab
