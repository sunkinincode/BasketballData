# ระบบจัดการนักกีฬาบาสเกตบอล

แอปพลิเคชันเว็บสำหรับจัดการข้อมูลนักกีฬาบาสเกตบอล สร้างด้วย React, Tailwind CSS, และ Supabase

## คุณสมบัติ

- **แท็บผู้ดูแลระบบ**: ดูข้อมูลนักกีฬาทั้งหมดและส่งออกเป็น CSV (รหัสผ่าน: `adminbas_`)
- **แท็บโค้ช**: ค้นหาและอัปเดตสถานะนักกีฬา (รหัสผ่าน: `coachbas_`)
- **แท็บนักกีฬา**: ดูรายชื่อนักกีฬาและอัปโหลดรูปภาพ (ไม่ต้องใช้รหัสผ่าน)

## การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Supabase

#### สร้างโปรเจกต์ Supabase

1. ไปที่ [supabase.com](https://supabase.com) และสร้างบัญชี
2. สร้างโปรเจกต์ใหม่
3. รอให้โปรเจกต์พร้อมใช้งาน

#### สร้างตารางฐานข้อมูล

ไปที่ SQL Editor ใน Supabase Dashboard และรันคำสั่ง SQL ต่อไปนี้:

```sql
-- สร้างตาราง athletes
CREATE TABLE athletes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT DEFAULT 'Basketball',
  status TEXT CHECK (status IN ('Starter', 'Substitute', 'Not Selected')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- เปิดให้อ่านข้อมูลได้สาธารณะ
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy สำหรับอ่านข้อมูล (สาธารณะ)
CREATE POLICY "Public read access" ON athletes
  FOR SELECT
  USING (true);

-- สร้าง Policy สำหรับเขียนข้อมูล (สาธารณะ - สำหรับอัปโหลดรูปภาพ)
CREATE POLICY "Public insert access" ON athletes
  FOR INSERT
  WITH CHECK (true);

-- สร้าง Policy สำหรับอัปเดตข้อมูล (สาธารณะ)
CREATE POLICY "Public update access" ON athletes
  FOR UPDATE
  USING (true);

-- สร้าง Trigger สำหรับอัปเดต updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE
    ON athletes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### สร้าง Storage Bucket

1. ไปที่ Storage ใน Supabase Dashboard
2. สร้าง Bucket ใหม่ชื่อ `athlete-images`
3. ตั้งค่าเป็น Public bucket (เปิดให้เข้าถึงได้สาธารณะ)
4. ตั้งค่า Policy:
   - **SELECT**: `true` (ให้ทุกคนอ่านได้)
   - **INSERT**: `true` (ให้ทุกคนอัปโหลดได้)
   - **UPDATE**: `true` (ให้ทุกคนอัปเดตได้)

หรือใช้คำสั่ง SQL นี้:

```sql
-- สร้าง Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('athlete-images', 'athlete-images', true);

-- สร้าง Policy สำหรับ Storage
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'athlete-images');

CREATE POLICY "Public Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'athlete-images');

CREATE POLICY "Public Update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'athlete-images');
```

### 3. ตั้งค่า Environment Variables

1. คัดลอกไฟล์ `.env.example` เป็น `.env`:

```bash
cp .env.example .env
```

2. แก้ไขไฟล์ `.env` และใส่ข้อมูล Supabase ของคุณ:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

คุณสามารถหา URL และ Anon Key ได้จาก:
- Supabase Dashboard → Settings → API

### 4. รันแอปพลิเคชัน

```bash
npm run dev
```

แอปพลิเคชันจะรันที่ `http://localhost:5173`

## การใช้งาน

### แท็บผู้ดูแลระบบ
- รหัสผ่าน: `adminbas_`
- ดูข้อมูลนักกีฬาทั้งหมดในรูปแบบตาราง
- ส่งออกข้อมูลเป็นไฟล์ CSV

### แท็บโค้ช
- รหัสผ่าน: `coachbas_`
- ค้นหานักกีฬาตามชื่อ
- อัปเดตสถานะนักกีฬา:
  - ผู้เล่นตัวจริง (Starter)
  - ตัวสำรอง (Substitute)
  - ไม่ถูกเลือก (Not Selected)

### แท็บนักกีฬา
- ไม่ต้องใช้รหัสผ่าน
- ดูรายชื่อนักกีฬาทั้งหมด
- ค้นหานักกีฬาตามชื่อ
- อัปโหลดรูปภาพนักกีฬา (รองรับ jpg, png, jpeg, ขนาดไม่เกิน 10MB)

## โครงสร้างโปรเจกต์

```
src/
├── components/
│   ├── Navbar.jsx          # แท็บนำทาง
│   ├── AdminTab.jsx        # หน้าผู้ดูแลระบบ
│   ├── CoachTab.jsx        # หน้าโค้ช
│   ├── AthleteTab.jsx      # หน้านักกีฬา
│   ├── PasswordModal.jsx   # หน้าต่างรหัสผ่าน
│   ├── SearchBar.jsx       # แถบค้นหา
│   └── ImageUpload.jsx     # อัปโหลดรูปภาพ
├── lib/
│   └── supabase.js         # การตั้งค่า Supabase
├── utils/
│   └── export.js           # ฟังก์ชันส่งออก CSV
├── App.jsx                  # คอมโพเนนต์หลัก
└── main.jsx                 # จุดเริ่มต้น
```

## เทคโนโลยีที่ใช้

- **React 18** - UI Framework
- **Vite** - Build Tool
- **Tailwind CSS** - CSS Framework
- **Supabase** - Backend (Database & Storage)

## หมายเหตุ

- รหัสผ่านจะถูกเก็บใน sessionStorage และจะถูกลบเมื่อปิดเบราว์เซอร์
- ข้อมูลรูปภาพจะถูกเก็บใน Supabase Storage
- ข้อมูลนักกีฬาจะถูกเก็บใน Supabase Database
