# AI_TESTCASE_EXECUTION_PRD.md

# SECTION 0 — AI EXECUTION DIRECTIVE (READ FIRST)

เอกสารนี้เป็นกฎควบคุมการสร้าง Test Case สำหรับ AI  
AI ต้องปฏิบัติตามลำดับและเงื่อนไขทั้งหมดก่อนสร้าง Test Case

## LANGUAGE EXECUTION ORDER (MANDATORY)

1. Thai Language Suite (TH) — รันก่อนเสมอ
2. English Language Suite (EN) — รันทันทีหลังจบ TH

กฎบังคับ
- Test Case ทุกข้อใน Section 5 ต้องรันครบในภาษาไทยก่อน
- หลังจบ TH Suite ให้สลับเป็น EN แล้วรัน Test Case ชุดเดียวกันซ้ำ
- ห้ามสลับภาษาไปมาระหว่าง Test Case
- ห้ามข้าม TH ไป EN โดยตรง

# SECTION 1 — SYSTEM OVERVIEW
ระบบ: Hotel Room Booking Web Application

Roles:
Guest — ค้นหา, จอง, อัปโหลดสลิป  
Admin — จัดการห้อง, สร้างการจองเองได้, ดูการจองของตน

# SECTION 2 — USER ROLES & PERMISSIONS

Guest
- ค้นหาห้องพัก
- ดูรายละเอียดห้อง
- ทำการจอง
- อัปโหลดหลักฐานการโอนเงิน
- ดูสถานะการจอง

Admin
- Login หลังบ้าน
- เพิ่ม / แก้ไข / ลบ ห้องพัก
- อัปโหลดรูปห้อง
- Make Booking (สร้างการจองแทนลูกค้าได้)
- View Own Bookings (ดูเฉพาะรายการที่ตนสร้าง)

# SECTION 3 — CORE FEATURES
1. ค้นหาห้องพักตามวันที่
2. ตรวจสอบห้องว่าง
3. ทำการจอง
4. อัปโหลดสลิปโอนเงิน
5. ตรวจสอบ QR Code ในสลิป
6. บันทึกข้อมูลการชำระเงิน
7. Admin จัดการห้อง
8. Admin สร้าง Booking เองได้

# SECTION 4 — BUSINESS RULES
- ห้องเต็ม → จองไม่ได้
- Check-out ต้องมากกว่า Check-in
- ต้องอัปโหลดสลิปก่อน Confirm
- สลิปต้องมี QR
- Admin ดูได้เฉพาะ Booking ที่ตนสร้าง

# SECTION 5 — TEST CASE GENERATION SCOPE
Booking Flow, Payment Verification, Admin Flow, Negative Case

# SECTION 6 — TEST DATA (FIXED DATASET)
Slip:
Testing Data/รูปภาพสำหรับ แนบหลักฐานการโอนเงิน/S__13377538.jpg

Room Images:
Testing Data/รูปภาพสำหรับ เพิ่มห้องพัก/Gemini_Generated_Image_Luxury Room.jpg
Testing Data/รูปภาพสำหรับ เพิ่มห้องพัก/Gemini_Generated_Image_Standard Room.jpg
Testing Data/รูปภาพสำหรับ เพิ่มห้องพัก/Gemini_Generated_Image_Suite.jpg

QR Code:
Testing Data/Config QR Code ชำระเงิน/QR Code ชำระเงิน.jpg

# SECTION 7 — EXPECTED AI OUTPUT FORMAT
| TC ID | Language | Role | Scenario | Steps | Expected Result |

# SECTION 8 — EXECUTION MATH
36 Logical TC × 2 Languages = 72 Runs

# SECTION 9 — STRICT AI RULE
ห้ามสร้าง Test Data ใหม่
ห้ามข้ามลำดับภาษา
ห้ามข้าม Negative Case
