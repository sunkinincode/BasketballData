import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ImageUpload = ({ athleteId, currentImageUrl, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0) // 1. เพิ่ม State สำหรับ Progress
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type (รองรับ HEIC)
    const fileName = file.name.toLowerCase()
    const validExtensions = ['jpg', 'jpeg', 'png', 'heic']
    const fileExtension = fileName.split('.').pop()

    if (!validExtensions.includes(fileExtension)) {
      setError(`ไม่รับนามสกุลไฟล์ .${fileExtension} (รองรับเฉพาะ JPG, PNG, HEIC)`)
      return
    }

    // Validate size
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10 MB')
      return
    }

    setError('')
    setUploading(true)
    setSuccess(false)
    setProgress(0) // รีเซ็ต Progress เป็น 0

    // 2. สร้างตัวจำลอง Progress Bar (Simulated Progress)
    // แถบจะค่อยๆ วิ่งไปเองเพื่อให้ User รู้ว่าระบบไม่ค้าง
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          // ถ้าถึง 90% แล้วยังอัปโหลดไม่เสร็จ ให้ค้างไว้ที่ 90
          return 90 
        }
        return prev + 10 // เพิ่มทีละ 10%
      })
    }, 300) // อัปเดตทุกๆ 300ms

    try {
      const storageFileName = `${athleteId}-${Date.now()}.${fileExtension}`
      const filePath = `athlete-images/${storageFileName}`

      const { error: uploadError } = await supabase.storage
        .from('athlete-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
        })

      if (uploadError) throw uploadError

      // เมื่ออัปโหลดเสร็จจริง ให้พุ่งไป 100%
      clearInterval(progressInterval)
      setProgress(100)

      const { data: { publicUrl } } = supabase.storage
        .from('athlete-images')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('athletes')
        .update({ image_url: publicUrl })
        .eq('id', athleteId)

      if (updateError) throw updateError

      setSuccess(true)
      if (onUploadSuccess) {
        onUploadSuccess(publicUrl)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
      setProgress(0) // ถ้า Error ให้รีเซ็ตหลอด
    } finally {
      clearInterval(progressInterval) // เคลียร์ Interval เพื่อหยุดการทำงาน
      setUploading(false)
    }
  }

  if (currentImageUrl) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          อัปโหลดรูปภาพแล้ว
        </span>
        <img
          src={currentImageUrl}
          alt="Athlete"
          className="w-16 h-16 object-cover rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      <label className="cursor-pointer block mb-2">
        <input
          type="file"
          accept=".jpg, .jpeg, .png, .heic, .HEIC, image/jpeg, image/png, image/heic"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <span className={`inline-block px-4 py-2 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {uploading ? 'กำลังประมวลผล...' : 'อัปโหลดรูปภาพ'}
        </span>
      </label>

      {/* 3. ส่วนแสดงผล Progress Bar */}
      {uploading && (
        <div className="w-full max-w-xs mt-3">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-blue-700">กำลังอัปโหลด</span>
            <span className="text-sm font-medium text-blue-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">
           ⚠️ {error}
        </p>
      )}
      
      {success && (
        <p className="mt-2 text-sm text-green-600 font-medium">✅ อัปโหลดรูปภาพสำเร็จ</p>
      )}
    </div>
  )
}

export default ImageUpload