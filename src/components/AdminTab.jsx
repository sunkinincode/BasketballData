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

  const handleExport = () => {
    if (athletes.length === 0) {
      setError('ไม่มีข้อมูลให้ส่งออก')
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
            disabled={loading || athletes.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รูปภาพ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {athletes.map((athlete) => (
                  <tr key={athlete.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {athlete.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getStatusLabel(athlete.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {athlete.image_url ? (
                        <span className="text-green-600">✓ มีรูปภาพ</span>
                      ) : (
                        <span className="text-gray-400">ไม่มีรูปภาพ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminTab
