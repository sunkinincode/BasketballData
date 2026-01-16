import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const ImageUpload = ({ athleteId, currentImageUrl, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // State ใหม่สำหรับฟีเจอร์ Timeout และ Manual Report
  const [showTimeoutLink, setShowTimeoutLink] = useState(false)
  const [isWaitingForReview, setIsWaitingForReview] = useState(false)
  
  // ใช้ useRef เพื่อเก็บ ID ของ Timer จะได้สั่งหยุดได้ถูกตัว
  const timeoutRef = useRef(null)

  // เคลียร์ Timer เมื่อ component ถูกถอดออก (กัน memory leak)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleReportProblem = async () => {
    // 1. เปิดลิงก์ Google Form (จะเปิด tab ใหม่เพราะมี target="_blank" ที่ <a>)
    
    // 2. เปลี่ยนสถานะหน้าเว็บเป็น "รอตรวจสอบ"
    setIsWaitingForReview(true)
    setUploading(false)
    setShowTimeoutLink(false)
    setError('')
    
    // (Optional) หากต้องการบันทึกลง Database ว่าคนนี้รอตรวจสอบ
    // สามารถเพิ่มโค้ด update database ตรงนี้ได้ เช่น:
    /*
    await supabase.from('athletes')
      .update({ status: 'รอตรวจสอบรูปภาพ' }) // หรือฟิลด์อื่นตามต้องการ
      .eq('id', athleteId)
    */
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
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

    // Reset State เริ่มต้น
    setError('')
    setUploading(true)
    setSuccess(false)
    setProgress(0)
    setShowTimeoutLink(false) 
    setIsWaitingForReview(false)

    // --- เริ่มจับเวลา 30 วินาที ---
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      // ถ้าครบ 30 วิ แล้วยังไม่เสร็จ (uploading ยังเป็น true) ให้โชว์ลิงก์
      setShowTimeoutLink(true)
    }, 30000)

    // Progress Bar Simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90 
        return prev + 10 
      })
    }, 300)

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

      // ถ้าสำเร็จก่อน 30 วิ ให้เคลียร์ Timer ทิ้ง
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      
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
      setProgress(0)
    } finally {
      clearInterval(progressInterval)
      // เคลียร์ Timer ใน finally ด้วยเพื่อความชัวร์ (กรณี Error)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setUploading(false)
    }
  }

  // กรณีที่มีรูปอยู่แล้ว
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

  // กรณีแจ้งปัญหาแล้ว ให้ขึ้นสถานะ "รอตรวจสอบ"
  if (isWaitingForReview) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium border border-yellow-200">
          ⚠️ รอตรวจสอบ
        </span>
        <p className="text-xs text-gray-500">
            ระบบได้รับแจ้งปัญหาแล้ว
        </p>
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

      {/* Progress Bar */}
      {uploading && (
        <div className="w-full max-w-xs mt-3">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-blue-700">กำลังอัปโหลด</span>
            <span className="text-sm font-medium text-blue-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
             {/* Progress Fill */}
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* --- แสดงลิงก์แจ้งปัญหาเมื่อเกิน 30 วินาที --- */}
          {showTimeoutLink && (
            <div className="mt-2 text-center animate-pulse">
                <a 
                    href="https://forms.gle/VjXBaaP6CqH3RNwH7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={handleReportProblem}
                    className="text-red-600 underline text-sm font-medium hover:text-red-800 cursor-pointer"
                >
                    กดตรงนี้หากมีปัญหาการอัพโหลดรูปภาพ
                </a>
            </div>
          )}
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