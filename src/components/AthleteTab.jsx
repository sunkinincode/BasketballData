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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAthletes.map((athlete) => (
              <div
                key={athlete.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="text-center mb-4">
                  {athlete.image_url ? (
                    <img
                      src={athlete.image_url}
                      alt={athlete.name}
                      className="w-24 h-24 object-cover rounded-full mx-auto mb-3"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">👤</span>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {athlete.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(athlete.status)}`}>
                    {getStatusLabel(athlete.status)}
                  </span>
                </div>
                <div className="mt-4">
                  <ImageUpload
                    athleteId={athlete.id}
                    currentImageUrl={athlete.image_url}
                    onUploadSuccess={handleUploadSuccess}
                  />
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
