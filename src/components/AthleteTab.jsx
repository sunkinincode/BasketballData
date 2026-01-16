import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ImageUpload from './ImageUpload'

const AthleteTab = () => {
  const [studentId, setStudentId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [athlete, setAthlete] = useState(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!studentId.trim()) {
      setError('กรุณากรอกรหัสนักศึกษา')
      return
    }

    setLoading(true)
    setError('')
    setAthlete(null)
    setAuthenticated(false)

    try {
      const { data, error: fetchError } = await supabase
        .from('athletes')
        .select('*')
        .eq('student_id', studentId.trim())
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('ไม่พบข้อมูลรหัสนักศึกษานี้')
        }
        throw fetchError
      }

      if (!data) {
        throw new Error('ไม่พบข้อมูลนักกีฬา')
      }

      setAthlete(data)
    } catch (err) {
      console.error('Error fetching athlete:', err)
      setError(err.message || 'ไม่สามารถค้นหาข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()

    if (!phoneNumber.trim()) {
      setError('กรุณากรอกเบอร์โทร')
      return
    }

    if (!athlete) {
      setError('กรุณาค้นหาข้อมูลก่อน')
      return
    }

    setVerifying(true)
    setError('')

    try {
      // Verify phone number matches
      const enteredPhone = phoneNumber.trim().replace(/\s+/g, '')
      const storedPhone = (athlete.phone_number || '').trim().replace(/\s+/g, '')

      if (enteredPhone !== storedPhone) {
        throw new Error('เบอร์โทรไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง')
      }

      setAuthenticated(true)
      setError('')
    } catch (err) {
      console.error('Verification error:', err)
      setError(err.message || 'ยืนยันตัวตนไม่สำเร็จ')
    } finally {
      setVerifying(false)
    }
  }

  const handleReset = () => {
    setStudentId('')
    setPhoneNumber('')
    setAthlete(null)
    setAuthenticated(false)
    setError('')
  }

  const handleUploadSuccess = async () => {
    // Refresh athlete data after upload
    if (athlete && athlete.student_id) {
      setLoading(true)
      setError('')
      try {
        const { data, error: fetchError } = await supabase
          .from('athletes')
          .select('*')
          .eq('student_id', athlete.student_id)
          .single()

        if (fetchError) throw fetchError
        if (data) {
          setAthlete(data)
        }
      } catch (err) {
        console.error('Error refreshing athlete:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'Starter': 'ผู้เล่นตัวจริง',
      'Substitute': 'ตัวสำรอง',
      'Not Selected': 'ไม่ถูกเลือก',
    }
    return statusMap[status] || 'ยังไม่ระบุ'
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'Starter': 'bg-green-100 text-green-800',
      'Substitute': 'bg-yellow-100 text-yellow-800',
      'Not Selected': 'bg-gray-100 text-gray-800',
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">ข้อมูลนักกีฬา</h2>

        {!authenticated ? (
          <>
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสนักศึกษา
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="กรุณากรอกรหัสนักศึกษา"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !studentId.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
                  </button>
                </div>
              </div>
            </form>

            {/* Verification Form (shown after search success) */}
            {athlete && (
              <form onSubmit={handleVerify} className="mb-6">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700 mb-3">
                    พบข้อมูล: <span className="font-semibold">{athlete.name}</span>
                    {athlete.nickname && <span className="ml-2">({athlete.nickname})</span>}
                  </p>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ยืนยันตัวตนด้วยเบอร์โทร
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="กรุณากรอกเบอร์โทรที่ลงทะเบียนไว้"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={verifying}
                      />
                      <button
                        type="submit"
                        disabled={verifying || !phoneNumber.trim()}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifying ? 'กำลังยืนยัน...' : 'ยืนยันตัวตน'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </>
        ) : (
          /* Large Athlete Card - Shown after successful verification */
          athlete && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  ค้นหาใหม่
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border border-blue-100">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Side - Image */}
                  <div className="flex-shrink-0 flex justify-center md:justify-start">
                    {athlete.image_url ? (
                      <img
                        src={athlete.image_url}
                        alt={athlete.name}
                        className="w-48 h-48 object-cover rounded-xl shadow-md"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gray-200 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-gray-400 text-6xl">👤</span>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Information */}
                  <div className="flex-1">
                    {/* Name with Nickname */}
                    <div className="mb-4">
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">
                        {athlete.name}
                      </h3>
                      {athlete.nickname && (
                        <p className="text-xl text-gray-600 font-semibold">
                          ({athlete.nickname})
                        </p>
                      )}
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {athlete.student_id && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">รหัสนักศึกษา</p>
                          <p className="text-lg font-semibold text-gray-800">{athlete.student_id}</p>
                        </div>
                      )}

                      {athlete.phone_number && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">เบอร์โทร</p>
                          <p className="text-lg font-semibold text-gray-800">{athlete.phone_number}</p>
                        </div>
                      )}

                      {athlete.year_of_study && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">ชั้นปี</p>
                          <p className="text-lg font-semibold text-gray-800">{athlete.year_of_study}</p>
                        </div>
                      )}

                      {athlete.curriculum && (
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">หลักสูตร</p>
                          <p className="text-lg font-semibold text-gray-800">{athlete.curriculum}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    {athlete.status && (
                      <div className="mb-6">
                        <span className={`px-4 py-2 rounded-full text-base font-medium ${getStatusColor(athlete.status)}`}>
                          สถานะ: {getStatusLabel(athlete.status)}
                        </span>
                      </div>
                    )}

                    {/* Image Upload */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">อัปโหลดรูปภาพ</p>
                      <ImageUpload
                        athleteId={athlete.id}
                        currentImageUrl={athlete.image_url}
                        onUploadSuccess={handleUploadSuccess}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default AthleteTab
