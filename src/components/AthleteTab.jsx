import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SearchBar from './SearchBar'
import ImageUpload from './ImageUpload'

const AthleteTab = () => {
  const [athletes, setAthletes] = useState([])
  const [filteredAthletes, setFilteredAthletes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAthletes()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAthletes(athletes)
    } else {
      // Since we only have Basketball, search by name instead
      const filtered = athletes.filter(athlete =>
        athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredAthletes(filtered)
    }
  }, [searchQuery, athletes])

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

  const handleUploadSuccess = (newImageUrl) => {
    // Refresh the athletes list to show updated image
    fetchAthletes()
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
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">รายชื่อนักกีฬาบาสเกตบอล</h2>

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
                    <div className="text-sm text-gray-600 mb-2">
                      {athlete.year_of_study && <span>{athlete.year_of_study}</span>}
                      {athlete.year_of_study && athlete.curriculum && <span> </span>}
                      {athlete.curriculum && <span>{athlete.curriculum}</span>}
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {athlete.status && (
                    <div className="mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(athlete.status)}`}>
                        {getStatusLabel(athlete.status)}
                      </span>
                    </div>
                  )}
                  
                  {/* Image Upload */}
                  <div className="mt-3">
                    <ImageUpload
                      athleteId={athlete.id}
                      currentImageUrl={athlete.image_url}
                      onUploadSuccess={handleUploadSuccess}
                    />
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

export default AthleteTab
