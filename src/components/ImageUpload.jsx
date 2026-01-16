import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ImageUpload = ({ athleteId, currentImageUrl, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // --- จุดที่แก้ไข 1: ตรวจสอบนามสกุลไฟล์ (Extension) โดยตรง เพื่อรองรับ HEIC ได้แม่นยำกว่า ---
    const fileName = file.name.toLowerCase()
    const validExtensions = ['jpg', 'jpeg', 'png', 'heic']
    const fileExtension = fileName.split('.').pop()

    if (!validExtensions.includes(fileExtension)) {
      // แจ้งเตือนทันทีตามที่ขอ
      setError(`ไม่รับนามสกุลไฟล์ .${fileExtension} (รองรับเฉพาะ JPG, PNG, HEIC)`)
      // ถ้าอยากให้เด้งเป็น Popup ให้ uncomment บรรทัดล่าง
      // alert('ไม่รับนามสกุลไฟล์ดังกล่าว') 
      return
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10 MB')
      return
    }

    setError('')
    setUploading(true)
    setSuccess(false)

    try {
      // Upload to Supabase Storage
      // ใช้ fileExtension ที่เราดึงมาแล้วด้านบน
      const storageFileName = `${athleteId}-${Date.now()}.${fileExtension}`
      const filePath = `athlete-images/${storageFileName}`

      // เพิ่ม option contentType เพื่อให้ Supabase รู้ว่าเป็นไฟล์ประเภทไหน (สำคัญสำหรับ HEIC)
      const { error: uploadError } = await supabase.storage
        .from('athlete-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('athlete-images')
        .getPublicUrl(filePath)

      // Update athlete record
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
    } finally {
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
    <div>
      <label className="cursor-pointer">
        <input
          type="file"
          // --- จุดที่แก้ไข 2: เพิ่ม .heic ใน accept attribute ---
          accept=".jpg, .jpeg, .png, .heic, .HEIC, image/jpeg, image/png, image/heic"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
        </span>
      </label>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">
           ⚠️ {error}
        </p>
      )}
      
      {success && (
        <p className="mt-2 text-sm text-green-600">อัปโหลดรูปภาพสำเร็จ</p>
      )}
    </div>
  )
}

export default ImageUpload