import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PasswordModal from './PasswordModal'
import SearchBar from './SearchBar'

const CoachTab = () => {
  const [authenticated, setAuthenticated] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [athletes, setAthletes] = useState([])
  const [filteredAthletes, setFilteredAthletes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [updating, setUpdating] = useState({})

  const COACH_PASSWORD = 'coachbas_'

  const statusOptions = [
    { value: 'Starter', label: 'ผู้เล่นตัวจริง' },
    { value: 'Substitute', label: 'ตัวสำรอง' },
    { value: 'Not Selected', label: 'ไม่ถูกเลือก' },
  ]

  useEffect(() => {
    // Check if already authenticated in this session
    const authStatus = sessionStorage.getItem('coach_authenticated')
    if (authStatus === 'true') {
      setAuthenticated(true)
      fetchAthletes()
    } else {
      setShowPasswordModal(true)
    }
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAthletes(athletes)
    } else {
      const filtered = athletes.filter(athlete =>
        athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredAthletes(filtered)
    }
  }, [searchQuery, athletes])

  const handlePasswordSuccess = () => {
    sessionStorage.setItem('coach_authenticated', 'true')
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
      setFilteredAthletes(data || [])
    } catch (err) {
      console.error('Error fetching athletes:', err)
      setError('ไม่สามารถโหลดข้อมูลนักกีฬาได้: ' + (err.message || 'เกิดข้อผิดพลาด'))
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (athleteId, newStatus) => {
    setUpdating(prev => ({ ...prev, [athleteId]: true }))
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase
        .from('athletes')
        .update({ status: newStatus })
        .eq('id', athleteId)

      if (updateError) throw updateError

      // Update local state
      setAthletes(prev =>
        prev.map(athlete =>
          athlete.id === athleteId
            ? { ...athlete, status: newStatus }
            : athlete
        )
      )
      setFilteredAthletes(prev =>
        prev.map(athlete =>
          athlete.id === athleteId
            ? { ...athlete, status: newStatus }
            : athlete
        )
      )

      setSuccess('อัปเดตสถานะสำเร็จ')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('ไม่สามารถอัปเดตสถานะได้: ' + (err.message || 'เกิดข้อผิดพลาด'))
      setTimeout(() => setError(''), 5000)
    } finally {
      setUpdating(prev => ({ ...prev, [athleteId]: false }))
    }
  }

  if (!authenticated) {
    return (
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        title="เข้าสู่ระบบโค้ช"
        password={COACH_PASSWORD}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">จัดการสถานะนักกีฬา</h2>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ค้นหานักกีฬา"
        />

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
        ) : filteredAthletes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchQuery ? 'ไม่พบนักกีฬาที่ค้นหา' : 'ไม่มีข้อมูลนักกีฬา'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAthletes.map((athlete) => (
              <div
                key={athlete.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {athlete.name}
                    </h3>
                    <div className="space-y-2">
                      {statusOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`status-${athlete.id}`}
                            value={option.value}
                            checked={athlete.status === option.value}
                            onChange={() => handleStatusChange(athlete.id, option.value)}
                            disabled={updating[athlete.id]}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            {option.label}
                          </span>
                          {updating[athlete.id] && athlete.status === option.value && (
                            <span className="ml-2 text-xs text-gray-500">
                              กำลังบันทึก...
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CoachTab
