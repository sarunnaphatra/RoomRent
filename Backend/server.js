const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const { sql } = require('./db');
const multer = require('multer'); // Import multer
const axios = require('axios');
const { google } = require('googleapis');
const FormData = require('form-data');

const app = express();
const PORT = 4455;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Multer Config for Slip Upload
const storage = multer.memoryStorage(); // Store file in memory to save as base64/buffer
const upload = multer({ storage: storage });

// Initialize DB and Start Server
const startServer = async () => {
    console.log('Starting server initialization...');
    await db.initDB();
    console.log('DB initialization complete. Starting HTTP server...');
    app.listen(PORT, () => {
        console.log(`Backend server running on http://127.0.0.1:${PORT}`);
    });
};

startServer();

// Mock Database (Fallback)
const USERS = [
    { id: 1, username: 'admin', password: 'password', role: 'admin' }
];
const ROOMS = [
    { id: 1, number: '101', type: 'Standard', price: 1000, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=60', status: 'Available' },
    { id: 2, number: '102', type: 'Standard', price: 1000, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=60', status: 'Available' },
    { id: 3, number: '201', type: 'Deluxe', price: 2500, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=60', status: 'Available' },
    { id: 4, number: '202', type: 'Deluxe', price: 2500, image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=500&q=60', status: 'Booked' },
    { id: 5, number: '301', type: 'Suite', price: 5000, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=500&q=60', status: 'Available' }
];
let BOOKINGS = [];

// --- Database Configuration Endpoint ---
app.post('/api/config/db', async (req, res) => {
    const result = await db.saveConfig(req.body);
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

// --- Reports Endpoint ---
app.get('/api/reports/revenue', async (req, res) => {
    try {
        const { filter, date } = req.query;
        const pool = db.getPool();
        if (!pool) return res.status(500).json({ success: false, message: 'Database not connected' });

        const selectedDate = date ? new Date(date) : new Date();
        const currentYear = selectedDate.getFullYear();
        const currentMonth = selectedDate.getMonth() + 1;
        
        // Helper to get start/end of week (Monday - Sunday)
        const getWeekRange = (d) => {
            const date = new Date(d);
            const day = date.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            
            const start = new Date(date.setDate(diff));
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            
            return { start, end };
        };

        let query = "";
        
        if (filter === 'year') {
            // Group by Month (1-12)
            query = `
                SELECT 
                    MONTH(checkIn) as label,
                    SUM(CASE WHEN YEAR(checkIn) = @currentYear THEN totalAmount ELSE 0 END) as currentRevenue,
                    SUM(CASE WHEN YEAR(checkIn) = @lastYear THEN totalAmount ELSE 0 END) as lastYearRevenue
                FROM bookings
                WHERE (YEAR(checkIn) = @currentYear OR YEAR(checkIn) = @lastYear)
                AND status != 'Cancelled'
                GROUP BY MONTH(checkIn)
                ORDER BY MONTH(checkIn)
            `;
            const result = await pool.request()
                .input('currentYear', sql.Int, currentYear)
                .input('lastYear', sql.Int, currentYear - 1)
                .query(query);
            
            // Format for frontend (12 months)
            const data = Array.from({length: 12}, (_, i) => {
                const month = i + 1;
                const row = result.recordset.find(r => r.label === month);
                return {
                    name: new Date(2000, i, 1).toLocaleString('default', { month: 'short' }),
                    current: row ? row.currentRevenue : 0,
                    lastYear: row ? row.lastYearRevenue : 0
                };
            });
            return res.json({ success: true, data });

        } else if (filter === 'month') {
            // Group by Day of Month (1-31)
            query = `
                SELECT 
                    DAY(checkIn) as label,
                    SUM(CASE WHEN YEAR(checkIn) = @currentYear AND MONTH(checkIn) = @currentMonth THEN totalAmount ELSE 0 END) as currentRevenue,
                    SUM(CASE WHEN YEAR(checkIn) = @lastYear AND MONTH(checkIn) = @currentMonth THEN totalAmount ELSE 0 END) as lastYearRevenue
                FROM bookings
                WHERE ((YEAR(checkIn) = @currentYear AND MONTH(checkIn) = @currentMonth) 
                    OR (YEAR(checkIn) = @lastYear AND MONTH(checkIn) = @currentMonth))
                AND status != 'Cancelled'
                GROUP BY DAY(checkIn)
                ORDER BY DAY(checkIn)
            `;
            const result = await pool.request()
                .input('currentYear', sql.Int, currentYear)
                .input('lastYear', sql.Int, currentYear - 1)
                .input('currentMonth', sql.Int, currentMonth)
                .query(query);

            const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
            const data = Array.from({length: daysInMonth}, (_, i) => {
                const day = i + 1;
                const row = result.recordset.find(r => r.label === day);
                return {
                    name: day.toString(),
                    current: row ? row.currentRevenue : 0,
                    lastYear: row ? row.lastYearRevenue : 0
                };
            });
            return res.json({ success: true, data });

        } else if (filter === 'week') {
            const { start: currentWeekStart, end: currentWeekEnd } = getWeekRange(selectedDate);
            
            // Last year week range (same dates shifted back 1 year is tricky, better use "same week number")
            // Or simple: 52 weeks ago.
            const lastYearWeekStart = new Date(currentWeekStart);
            lastYearWeekStart.setFullYear(lastYearWeekStart.getFullYear() - 1);
            const lastYearWeekEnd = new Date(currentWeekEnd);
            lastYearWeekEnd.setFullYear(lastYearWeekEnd.getFullYear() - 1);

            // Group by Day of Week (1-7). 
            // We'll normalize in JS to ensure Monday=1, Sunday=7 mapping.
            // SQL DATEPART(weekday) depends on settings.
            // Safer: return date and map in JS.
            
            query = `
                SELECT 
                    checkIn,
                    totalAmount,
                    YEAR(checkIn) as bookingYear
                FROM bookings
                WHERE (
                    (checkIn >= @currentStart AND checkIn <= @currentEnd)
                    OR 
                    (checkIn >= @lastStart AND checkIn <= @lastEnd)
                )
                AND status != 'Cancelled'
            `;
             const result = await pool.request()
                .input('currentStart', sql.DateTime, currentWeekStart)
                .input('currentEnd', sql.DateTime, currentWeekEnd)
                .input('lastStart', sql.DateTime, lastYearWeekStart)
                .input('lastEnd', sql.DateTime, lastYearWeekEnd)
                .query(query);
            
            // Initialize data structure for Mon-Sun
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const dataMap = days.map(d => ({ name: d, current: 0, lastYear: 0 }));

            result.recordset.forEach(row => {
                const d = new Date(row.checkIn);
                // getDay(): 0=Sun, 1=Mon...
                let dayIndex = d.getDay() - 1; 
                if (dayIndex === -1) dayIndex = 6; // Sunday becomes 6

                // Check if booking falls within current week range
                if (d >= currentWeekStart && d <= currentWeekEnd) {
                    dataMap[dayIndex].current += row.totalAmount;
                } else {
                    dataMap[dayIndex].lastYear += row.totalAmount;
                }
            });
            
            return res.json({ success: true, data: dataMap });
        }

        return res.json({ success: false, message: 'Invalid filter' });

    } catch (err) {
        console.error('Report Error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Helper Functions for Notifications & Calendar ---

async function getSetting(key) {
    const pool = db.getPool();
    if (!pool) return null;
    try {
        const result = await pool.request()
            .input('key', sql.VarChar, key)
            .query('SELECT value FROM settings WHERE [key] = @key');
        return result.recordset.length > 0 ? result.recordset[0].value : null;
    } catch (err) {
        console.error(`Error fetching setting ${key}:`, err);
        return null;
    }
}

const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

async function sendLineNotification(booking, slipBase64) {
    const token = await getSetting('line_notify_token');
    if (!token) return;

    try {
        let roomInfo = `Room ID: ${booking.roomId}`;
        if (booking.roomNumber && booking.roomType) {
            roomInfo = `${booking.roomNumber} (${booking.roomType})`;
        } else {
             // Try to fetch if not provided
            const pool = db.getPool();
            if (pool) {
                try {
                    const roomRes = await pool.request()
                        .input('id', sql.Int, booking.roomId)
                        .query('SELECT number, type FROM rooms WHERE id = @id');
                    if (roomRes.recordset.length > 0) {
                        const r = roomRes.recordset[0];
                        roomInfo = `${r.number} (${r.type})`;
                    }
                } catch (e) { console.error('Error fetching room info for Line:', e); }
            }
        }

        const total = Number(booking.totalAmount).toLocaleString('th-TH');
        const paid = Number(booking.paidAmount || 0).toLocaleString('th-TH');
        const remaining = (Number(booking.totalAmount) - Number(booking.paidAmount || 0)).toLocaleString('th-TH');
        const checkIn = formatDate(booking.checkIn);
        const checkOut = formatDate(booking.checkOut);
        const bookingDate = formatDate(new Date());

        let paymentStatusText = 'รอตรวจสอบ';
        if (booking.paymentStatus === 'Paid in Full') paymentStatusText = 'ชำระครบแล้ว';
        else if (booking.paymentStatus === 'Deposit Paid') paymentStatusText = 'ชำระมัดจำแล้ว';
        else if (booking.paymentStatus === 'Pending Payment') paymentStatusText = 'รอชำระเงิน';
        
        // Build Additional Services String
        let additionalServicesPart = '';
        if ((booking.guestCount && booking.guestCount > 5) || (booking.breakfastCount && booking.breakfastCount > 0) || (booking.dinnerCount && booking.dinnerCount > 0)) {
             additionalServicesPart += '\n บริการเพิ่มเติม';
             if (booking.guestCount > 5) {
                 additionalServicesPart += `\n - จำนวนผู้เข้าพัก (เสริม ${booking.guestCount - 5} ท่าน): ${booking.guestCount} ท่าน`;
             }
             if (booking.breakfastCount > 0) {
                 additionalServicesPart += `\n - อาหารเช้า: ${booking.breakfastCount} ชุด`;
             }
             if (booking.dinnerCount > 0) {
                 additionalServicesPart += `\n - อาหารเย็น (${booking.dinnerType === 'Large' ? 'เซ็ตใหญ่' : 'เซ็ตเล็ก'}): ${booking.dinnerCount} ชุด`;
             }
             additionalServicesPart += '\n ';
        }

        const message = `
 เลขที่การจอง : ${booking.bookingId}  [${bookingDate}] 
 --------------------------------------------- 
 ใบเสร็จรับเงิน/ใบจอง 
 --------------------------------------------- 
 ชื่อผู้เข้าพัก : ${booking.guestName} 
 เบอร์โทรศัพท์ลูกค้า : ${booking.guestPhone || '-'} 
 
 รายละเอียดการจอง 
 ห้อง : ${roomInfo} 
 วันที่เช็คอิน : ${checkIn} เวลา 14.00 น. 
 วันที่เช็คเอาท์ : ${checkOut} เวลา 12.00 น. 
 ${additionalServicesPart}--------------------------------------------- 
 การชำระเงิน 
 ราคารวม : ฿${total} 
 ชำระแล้ว (${paymentStatusText}) 
 - ฿${paid} 
 ยอดคงเหลือ (ชำระเพิ่มเมื่อเช็คอิน) 
 ฿${remaining} 
 ---------------------------------------------`.trim();
        
        const form = new FormData();
        form.append('message', message);
        
        if (slipBase64) {
            // Convert base64 to buffer
            const matches = slipBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const buffer = Buffer.from(matches[2], 'base64');
                form.append('imageFile', buffer, { filename: 'slip.jpg' });
            }
        }

        await axios.post('https://notify-api.line.me/api/notify', form, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });
        console.log('Line notification sent');
    } catch (err) {
        console.error('Error sending Line notification:', err.message);
    }
}

async function sendTelegramNotification(booking, slipBase64) {
    const token = await getSetting('telegram_bot_token');
    const chatId = await getSetting('telegram_chat_id');
    if (!token || !chatId) return;

    try {
        const hotelName = await getSetting('hotel_name') || 'อุ้ยคำแปง โฮมสเตย์ (ติดต่อ-สอบถาม โทร 053-111111)';
        const hotelAddress = await getSetting('hotel_address') || '67/1 หมู่ 5 ต.เชียงกลาง อ.เชียงกลาง จ.น่าน ปณ.55160';
        
        let roomInfo = `Room ${booking.roomId}`;
        
        if (booking.roomNumber && booking.roomType) {
            roomInfo = `${booking.roomNumber} (${booking.roomType})`;
        } else {
            const pool = db.getPool();
            if (pool) {
                const roomRes = await pool.request()
                    .input('id', sql.Int, booking.roomId)
                    .query('SELECT number, type FROM rooms WHERE id = @id');
                if (roomRes.recordset.length > 0) {
                    const r = roomRes.recordset[0];
                    roomInfo = `${r.number} (${r.type})`;
                }
            } else {
                // Fallback for mock data if needed, or just use ID
                const r = ROOMS.find(rm => rm.id === booking.roomId);
                if (r) roomInfo = `${r.number} (${r.type})`;
            }
        }

        const total = Number(booking.totalAmount).toLocaleString('th-TH');
        const paid = Number(booking.paidAmount || 0).toLocaleString('th-TH');
        const remaining = (Number(booking.totalAmount) - Number(booking.paidAmount || 0)).toLocaleString('th-TH');
        const checkInDate = formatDate(booking.checkIn);
        const checkOutDate = formatDate(booking.checkOut);
        const bookingDate = formatDate(new Date());
        
        // Build Additional Services String
        let additionalServicesPart = '';
        if ((booking.guestCount && booking.guestCount > 5) || (booking.breakfastCount && booking.breakfastCount > 0) || (booking.dinnerCount && booking.dinnerCount > 0)) {
             additionalServicesPart += '\n บริการเพิ่มเติม';
             if (booking.guestCount > 5) {
                 additionalServicesPart += `\n - จำนวนผู้เข้าพัก (เสริม ${booking.guestCount - 5} ท่าน): ${booking.guestCount} ท่าน`;
             }
             if (booking.breakfastCount > 0) {
                 additionalServicesPart += `\n - อาหารเช้า: ${booking.breakfastCount} ชุด`;
             }
             if (booking.dinnerCount > 0) {
                 additionalServicesPart += `\n - อาหารเย็น (${booking.dinnerType === 'Large' ? 'เซ็ตใหญ่' : 'เซ็ตเล็ก'}): ${booking.dinnerCount} ชุด`;
             }
             additionalServicesPart += '\n ';
        }
        
        let paymentStatusText = 'รอตรวจสอบ';
        if (booking.paymentStatus === 'Paid in Full') paymentStatusText = 'ชำระครบแล้ว';
        else if (booking.paymentStatus === 'Deposit Paid') paymentStatusText = 'ชำระมัดจำแล้ว';
        else if (booking.paymentStatus === 'Pending Payment') paymentStatusText = 'รอชำระเงิน';

        const message = `
 เลขที่การจอง : ${booking.bookingId}  [${bookingDate}] 
 --------------------------------------------- 
 ใบเสร็จรับเงิน/ใบจอง 
 --------------------------------------------- 
 ชื่อผู้เข้าพัก : ${booking.guestName} 
 เบอร์โทรศัพท์ลูกค้า : ${booking.guestPhone || '-'} 
 
 รายละเอียดการจอง 
 ห้อง : ${roomInfo} 
 วันที่เช็คอิน : ${checkInDate} เวลา 14.00 น. 
 วันที่เช็คเอาท์ : ${checkOutDate} เวลา 12.00 น. 
 ${additionalServicesPart}--------------------------------------------- 
 การชำระเงิน 
 ราคารวม : ฿${total} 
 ชำระแล้ว (${paymentStatusText}) 
 - ฿${paid} 
 ยอดคงเหลือ (ชำระเพิ่มเมื่อเช็คอิน) 
 ฿${remaining} 
 ---------------------------------------------`.trim();

        // Send Message
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            // parse_mode: 'Markdown' // Removed Markdown mode as the user template is plain text with newlines
        });

        // Send Photo
        if (slipBase64) {
            const matches = slipBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const buffer = Buffer.from(matches[2], 'base64');
                const form = new FormData();
                form.append('chat_id', chatId);
                form.append('photo', buffer, { filename: 'slip.jpg' });
                
                await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, {
                    headers: form.getHeaders()
                });
            }
        }
        console.log('Telegram notification sent');
    } catch (err) {
        console.error('Error sending Telegram notification:', err.message);
    }
}

async function addToGoogleCalendar(booking) {
    const calendarId = await getSetting('google_calendar_id') || 's2.sarunnaphatra@gmail.com';
    const serviceAccountJson = await getSetting('google_service_account_json');
    
    if (!serviceAccountJson) {
        console.log('Google Service Account JSON not configured. Skipping Calendar event.');
        return null;
    }

    try {
        const credentials = JSON.parse(serviceAccountJson);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        const calendar = google.calendar({ version: 'v3', auth });
        
        // Fetch room info for better description
        let roomInfo = `Room ${booking.roomId}`;
        const pool = db.getPool();
        if (pool) {
            try {
                const roomRes = await pool.request()
                    .input('id', sql.Int, booking.roomId)
                    .query('SELECT number, type FROM rooms WHERE id = @id');
                if (roomRes.recordset.length > 0) {
                    const r = roomRes.recordset[0];
                    roomInfo = `${r.number} (${r.type})`;
                }
            } catch (e) { console.error('Error fetching room info for calendar:', e); }
        } else {
             const r = ROOMS.find(rm => rm.id === booking.roomId);
             if (r) roomInfo = `${r.number} (${r.type})`;
        }

        // Format Data
        const bookingDate = formatDate(new Date());
        const checkInDate = formatDate(booking.checkIn);
        const checkOutDate = formatDate(booking.checkOut);
        const total = Number(booking.totalAmount).toLocaleString('th-TH');
        const paid = Number(booking.paidAmount || 0).toLocaleString('th-TH');
        const remaining = (Number(booking.totalAmount) - Number(booking.paidAmount || 0)).toLocaleString('th-TH');

        let paymentStatusText = 'รอตรวจสอบ';
        if (booking.paymentStatus === 'Paid in Full') paymentStatusText = 'ชำระครบแล้ว';
        else if (booking.paymentStatus === 'Deposit Paid') paymentStatusText = 'ชำระมัดจำแล้ว';
        else if (booking.paymentStatus === 'Pending Payment') paymentStatusText = 'รอชำระเงิน';

        // Build Additional Services String
        let additionalServicesPart = '';
        if ((booking.guestCount && booking.guestCount > 5) || (booking.breakfastCount && booking.breakfastCount > 0) || (booking.dinnerCount && booking.dinnerCount > 0)) {
             additionalServicesPart += '\n บริการเพิ่มเติม';
             if (booking.guestCount > 5) {
                 additionalServicesPart += `\n - จำนวนผู้เข้าพัก (เสริม ${booking.guestCount - 5} ท่าน): ${booking.guestCount} ท่าน`;
             }
             if (booking.breakfastCount > 0) {
                 additionalServicesPart += `\n - อาหารเช้า: ${booking.breakfastCount} ชุด`;
             }
             if (booking.dinnerCount > 0) {
                 additionalServicesPart += `\n - อาหารเย็น (${booking.dinnerType === 'Large' ? 'เซ็ตใหญ่' : 'เซ็ตเล็ก'}): ${booking.dinnerCount} ชุด`;
             }
             additionalServicesPart += '\n ';
        }

        const description = `
 เลขที่การจอง : ${booking.bookingId}  [${bookingDate}] 
 ---------------------------------
 ใบเสร็จรับเงิน/ใบจอง 
 ---------------------------------
 ชื่อผู้เข้าพัก : ${booking.guestName} 
 เบอร์โทรศัพท์ลูกค้า : ${booking.guestPhone || '-'} 
 
 รายละเอียดการจอง 
 ห้อง : ${roomInfo} 
 วันที่เช็คอิน : ${checkInDate} เวลา 14.00 น. 
 วันที่เช็คเอาท์ : ${checkOutDate} เวลา 12.00 น. 
 ${additionalServicesPart}---------------------------------
 การชำระเงิน 
 ราคารวม : ฿${total} 
 ชำระแล้ว (${paymentStatusText}) 
 - ฿${paid} 
 ยอดคงเหลือ (ชำระเพิ่มเมื่อเช็คอิน) 
 ฿${remaining} 
 ---------------------------------`.trim();

        // Robust date formatting
        const formatDateIso = (dateVal) => {
            if (!dateVal) return new Date().toISOString().split('T')[0];
            
            // If it's already a string in YYYY-MM-DD format (or starts with it), use it.
            if (typeof dateVal === 'string') {
                const match = dateVal.match(/^(\d{4}-\d{2}-\d{2})/);
                if (match) return match[1];
            }
            
            // If it's a Date object
            if (dateVal instanceof Date && !isNaN(dateVal)) {
                try {
                    // Use Intl to format to Bangkok date string YYYY-MM-DD
                    const formatter = new Intl.DateTimeFormat('en-CA', { 
                        timeZone: 'Asia/Bangkok',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                    return formatter.format(dateVal);
                } catch (e) {
                    // Fallback to local time components if Intl fails
                    const year = dateVal.getFullYear();
                    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
                    const day = String(dateVal.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }
            
            return new Date().toISOString().split('T')[0];
        };

        const checkInIso = formatDateIso(booking.checkIn);
        const checkOutIso = formatDateIso(booking.checkOut);

        console.log(`[DEBUG] booking.checkIn: ${booking.checkIn} (${typeof booking.checkIn})`);
        console.log(`[DEBUG] checkInIso: ${checkInIso}`);

        // Use explicit +07:00 offset for Thailand Time
        // And explicitly set timeZone to 'Asia/Bangkok' to ensure Google Calendar understands context
        const startDateTime = `${checkInIso}T14:00:00+07:00`;
        const endDateTime = `${checkOutIso}T12:00:00+07:00`;

        console.log(`[Google Calendar] Dates processed: CheckInRaw=${booking.checkIn} -> ${startDateTime}, CheckOutRaw=${booking.checkOut} -> ${endDateTime}`);

        const event = {
            summary: `Booking: ${booking.guestName} (${roomInfo})`,
            description: description,
            start: {
                dateTime: startDateTime,
                timeZone: 'Asia/Bangkok',
            },
            end: {
                dateTime: endDateTime,
                timeZone: 'Asia/Bangkok',
            },
        };

        console.log('Creating Google Calendar Event with payload:', JSON.stringify(event, null, 2));

        const res = await calendar.events.insert({
            calendarId,
            resource: event,
        });

        console.log('Google Calendar event created:', res.data.id);
        return res.data.id;
    } catch (err) {
        console.error('Error adding to Google Calendar:', err.message);
        if (err.code === 403) {
            console.error('---------------------------------');
            console.error('PERMISSION ERROR: The Service Account cannot write to the calendar.');
            console.error(`Target Calendar ID: ${calendarId}`);
            try {
                const credentials = JSON.parse(serviceAccountJson);
                console.error(`Service Account Email: ${credentials.client_email}`);
                console.error('SOLUTION: Share the calendar with this email and grant "Make changes to events" permission.');
            } catch (e) { /* ignore */ }
            console.error('---------------------------------');
        }
        return null;
    }
}

async function deleteFromGoogleCalendar(googleEventId) {
    if (!googleEventId) return;
    
    const calendarId = await getSetting('google_calendar_id') || 's2.sarunnaphatra@gmail.com';
    const serviceAccountJson = await getSetting('google_service_account_json');
    
    if (!serviceAccountJson) return;

    try {
        const credentials = JSON.parse(serviceAccountJson);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        const calendar = google.calendar({ version: 'v3', auth });
        
        await calendar.events.delete({
            calendarId,
            eventId: googleEventId
        });
        console.log('Google Calendar event deleted:', googleEventId);
    } catch (err) {
        console.error('Error deleting from Google Calendar:', err.message);
    }
}

// --- Upload Slip Endpoint ---
app.post('/api/upload-slip', upload.single('slip'), async (req, res) => {
    // In a real app, we would upload to S3/Cloud storage or save to disk.
    // For this demo, we can just acknowledge the upload or save as Base64 to DB (if we add a column).
    // Let's assume we just want to verify it's uploaded.
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Convert to Base64 for storage (optional, or just return success)
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Note: We are not linking to booking yet because booking might be created AFTER this call in current flow,
    // or we pass bookingId if booking created first.
    // Given the flow: Payment -> Slip -> Confirm Booking
    // We can return the base64 string to frontend to include in booking creation payload.
    
    // BUT, the user asked to "attach slip" BEFORE summary.
    // And in our frontend logic, we create booking after slip upload success.
    // So let's store it temporarily or just return success.
    
    // For simplicity, let's just return success and the base64 image
    // If we wanted to save to DB, we'd need a 'slip_image' column in bookings table.
    
    res.json({ success: true, message: 'Slip uploaded successfully', slipImage: base64Image });
});

// --- API Endpoints (Dual Mode: SQL vs Mock) ---

// Register Endpoint
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const pool = db.getPool();
    if (pool) {
        try {
            const request = pool.request();
            request.input('username', sql.VarChar, username);
            const check = await request.query('SELECT * FROM users WHERE username = @username');
            
            if (check.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            }

            const insertReq = pool.request();
            insertReq.input('username', sql.VarChar, username);
            insertReq.input('password', sql.VarChar, password);
            insertReq.input('role', sql.VarChar, 'customer');
            await insertReq.query("INSERT INTO users (username, password, role) VALUES (@username, @password, @role)");
            
            return res.json({ success: true, message: 'Registration successful' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        // Fallback
        const existingUser = USERS.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }
        const newUser = { id: USERS.length + 1, username, password, role: 'customer' };
        USERS.push(newUser);
        res.json({ success: true, message: 'Registration successful' });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const pool = db.getPool();

    if (pool) {
        try {
            const request = pool.request();
            request.input('username', sql.VarChar, username);
            request.input('password', sql.VarChar, password);
            const result = await request.query('SELECT * FROM users WHERE username = @username AND password = @password');
            
            if (result.recordset.length > 0) {
                const user = result.recordset[0];
                return res.json({ 
                    success: true, 
                    message: 'Login successful', 
                    token: `mock-token-${user.role}`,
                    user: { id: user.id, username: user.username, role: user.role }
                });
            } else {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        const user = USERS.find(u => u.username === username && u.password === password);
        if (user) {
            res.json({ 
                success: true, 
                message: 'Login successful', 
                token: `mock-token-${user.role}`,
                user: { id: user.id, username: user.username, role: user.role }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    }
});

// Get Rooms (Optimized: Exclude gallery images to reduce payload size)
app.get('/api/rooms', async (req, res) => {
    const pool = db.getPool();
    if (pool) {
        try {
            // Only fetch main image, exclude the heavy JSON PATH subquery for all images
            // But we need the count of additional images for the UI badge
            const result = await pool.request().query(`
                SELECT r.*, 
                (SELECT COUNT(*) FROM room_images WHERE room_id = r.id) as gallery_count
                FROM rooms r
            `);
            
            const rooms = result.recordset.map(r => {
                const galleryCount = r.gallery_count || 0;
                // Main image is in 'image' column. Gallery images are in 'room_images' table.
                // Total count = 1 (main) + galleryCount (if main exists)
                // Actually, let's just pass the gallery count separately or simulate the images array length logic if we want to keep frontend minimal changes.
                // But frontend uses room.images.length. 
                // Let's add a specific 'imageCount' property.
                
                return { 
                    ...r, 
                    price: Number(r.price),
                    images: r.image ? [r.image] : [], // Default to just main image for display
                    totalImages: (r.image ? 1 : 0) + galleryCount
                };
            });
            
            res.json({ success: true, data: rooms });
        } catch (err) {
            console.error('Database error fetching rooms:', err);
            console.log('Falling back to mock data due to DB error');
            res.json({ success: true, data: ROOMS });
        }
    } else {
        res.json({ success: true, data: ROOMS });
    }
});

// Get Room Images (Lazy Load)
app.get('/api/rooms/:id/images', async (req, res) => {
    const { id } = req.params;
    const pool = db.getPool();
    if (pool) {
        try {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT image FROM rooms WHERE id = @id;
                    SELECT image_data FROM room_images WHERE room_id = @id;
                `);
            
            const mainImage = result.recordsets[0][0]?.image;
            const additionalImages = result.recordsets[1].map(row => row.image_data);
            
            // Combine main image + additional images
            // Filter out additional images that are identical to the main image to prevent duplicates
            const uniqueAdditionalImages = additionalImages.filter(img => img !== mainImage);
            const images = mainImage ? [mainImage, ...uniqueAdditionalImages] : additionalImages;
            
            res.json({ success: true, data: images });
        } catch (err) {
            console.error('Error fetching room images:', err);
            res.status(500).json({ success: false, message: 'Error fetching images' });
        }
    } else {
        // Mock data fallback
        const room = ROOMS.find(r => r.id == id);
        res.json({ success: true, data: room ? [room.image] : [] });
    }
});


// Add Room
app.post('/api/rooms', async (req, res) => {
    const { number, type, price, image, status, images } = req.body;
    if (!number || !type || !price) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const pool = db.getPool();
    if (pool) {
        try {
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                const request = transaction.request();
                request.input('number', sql.VarChar, number);
                request.input('type', sql.VarChar, type);
                request.input('price', sql.Decimal(10, 2), price);
                request.input('image', sql.VarChar(sql.MAX), image || ''); // Main thumbnail
                request.input('status', sql.VarChar, status || 'Available');
                
                const result = await request.query(`
                    INSERT INTO rooms (number, type, price, image, status) 
                    VALUES (@number, @type, @price, @image, @status);
                    SELECT SCOPE_IDENTITY() AS id;
                `);
                
                const roomId = result.recordset[0].id;

                // Insert additional images
                // Filter out main image to prevent duplication in room_images
                if (images && Array.isArray(images) && images.length > 0) {
                    const uniqueImages = images.filter(img => img !== image);
                    for (const imgData of uniqueImages) {
                        const imgRequest = transaction.request();
                        imgRequest.input('roomId', sql.Int, roomId);
                        imgRequest.input('imageData', sql.VarChar(sql.MAX), imgData);
                        await imgRequest.query(`INSERT INTO room_images (room_id, image_data) VALUES (@roomId, @imageData)`);
                    }
                }

                await transaction.commit();
                
                const newRoom = { id: roomId, number, type, price: Number(price), image, status: status || 'Available', images: images || [] };
                res.json({ success: true, message: 'Room added successfully', data: newRoom });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        const newRoom = {
            id: ROOMS.length > 0 ? Math.max(...ROOMS.map(r => r.id)) + 1 : 1,
            number,
            type,
            price: Number(price),
            image: image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=60',
            status: status || 'Available',
            images: images || []
        };
        ROOMS.push(newRoom);
        res.json({ success: true, message: 'Room added successfully', data: newRoom });
    }
});

// Update Room
app.put('/api/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const { number, type, price, image, status, images } = req.body;

    const pool = db.getPool();
    if (pool) {
        try {
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                const request = transaction.request();
                request.input('id', sql.Int, id);
                request.input('number', sql.VarChar, number);
                request.input('type', sql.VarChar, type);
                request.input('price', sql.Decimal(10, 2), price);
                request.input('image', sql.VarChar(sql.MAX), image);
                request.input('status', sql.VarChar, status);

                await request.query('UPDATE rooms SET number=@number, type=@type, price=@price, image=@image, status=@status WHERE id=@id');

                // Update images: Simple strategy -> Delete all and re-insert
                // For simplicity given the UI likely sends the full list: Delete all for this room and re-insert
                if (images && Array.isArray(images)) {
                    const deleteRequest = transaction.request();
                    deleteRequest.input('roomId', sql.Int, id);
                    await deleteRequest.query('DELETE FROM room_images WHERE room_id = @roomId');

                    // Filter out main image to prevent duplication
                    const uniqueImages = images.filter(img => img !== image);

                    for (const imgData of uniqueImages) {
                        const imgRequest = transaction.request();
                        imgRequest.input('roomId', sql.Int, id);
                        imgRequest.input('imageData', sql.VarChar(sql.MAX), imgData);
                        await imgRequest.query(`INSERT INTO room_images (room_id, image_data) VALUES (@roomId, @imageData)`);
                    }
                }

                await transaction.commit();
                res.json({ success: true, message: 'Room updated successfully' });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        const roomIndex = ROOMS.findIndex(r => r.id == id);
        if (roomIndex === -1) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        ROOMS[roomIndex] = { ...ROOMS[roomIndex], number, type, price: Number(price), image, status, images: images || [] };
        res.json({ success: true, message: 'Room updated successfully', data: ROOMS[roomIndex] });
    }
});

// Delete Room
app.delete('/api/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const pool = db.getPool();
    if (pool) {
        try {
            const request = pool.request();
            request.input('id', sql.Int, id);
            await request.query('DELETE FROM rooms WHERE id = @id');
            res.json({ success: true, message: 'Room deleted successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        const roomIndex = ROOMS.findIndex(r => r.id == id);
        if (roomIndex === -1) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        ROOMS.splice(roomIndex, 1);
        res.json({ success: true, message: 'Room deleted successfully' });
    }
});

// Get Bookings
app.get('/api/bookings', async (req, res) => {
    const pool = db.getPool();
    if (pool) {
        try {
            const result = await pool.request().query('SELECT * FROM bookings ORDER BY created_at DESC');
            // Ensure numbers
            const bookings = result.recordset.map(b => ({ 
                ...b, 
                roomId: Number(b.roomId), 
                totalAmount: Number(b.totalAmount), 
                paidAmount: Number(b.paidAmount),
                userId: b.userId ? Number(b.userId) : null
            }));
            res.json({ success: true, data: bookings });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        res.json({ success: true, data: BOOKINGS });
    }
});

// Create Booking
app.post('/api/bookings', async (req, res) => {
    const { 
        roomId, guestName, guestPhone, checkIn, checkOut, totalAmount, userId, 
        paymentType, paidAmount, slipImage,
        guestCount, breakfastCount, dinnerCount, dinnerType, specialRequests
    } = req.body;
    
    if (!roomId || !guestName || !checkIn || !checkOut) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const bookingId = `BK-${Date.now().toString().slice(-6)}`;
    const status = 'Confirmed';
    let paymentStatus = 'Pending';
    if (paidAmount >= totalAmount) paymentStatus = 'Paid in Full';
    else if (paidAmount > 0) paymentStatus = 'Deposit Paid';
    else paymentStatus = 'Pending Payment';

    const pool = db.getPool();
    if (pool) {
        try {
            const request = pool.request();
            request.input('bookingId', sql.VarChar, bookingId);
            request.input('guestName', sql.VarChar, guestName);
            request.input('guestPhone', sql.VarChar, guestPhone || null);
            request.input('roomId', sql.Int, roomId);
            request.input('userId', sql.Int, userId || null);
            request.input('checkIn', sql.Date, checkIn);
            request.input('checkOut', sql.Date, checkOut);
            request.input('paymentType', sql.VarChar, paymentType || 'Full');
            request.input('totalAmount', sql.Decimal(10, 2), totalAmount);
            request.input('paidAmount', sql.Decimal(10, 2), paidAmount || 0);
            request.input('paymentStatus', sql.VarChar, paymentStatus);
            request.input('status', sql.VarChar, status);
            request.input('slipImage', sql.VarChar(sql.MAX), slipImage || null);
            
            // New inputs
            request.input('guestCount', sql.Int, guestCount || 1);
            request.input('breakfastCount', sql.Int, breakfastCount || 0);
            request.input('dinnerCount', sql.Int, dinnerCount || 0);
            request.input('dinnerType', sql.VarChar, dinnerType || 'Small');
            request.input('specialRequests', sql.VarChar(sql.MAX), specialRequests || '');

            // Fetch Room Info
            let roomNumber = '', roomType = '';
            const roomRes = await pool.request()
                .input('id', sql.Int, roomId)
                .query('SELECT number, type FROM rooms WHERE id = @id');
            if (roomRes.recordset.length > 0) {
                roomNumber = roomRes.recordset[0].number;
                roomType = roomRes.recordset[0].type;
            }
            request.input('roomNumber', sql.VarChar, roomNumber);
            request.input('roomType', sql.VarChar, roomType);

            const result = await request.query(`
                INSERT INTO bookings 
                (bookingId, guestName, guestPhone, roomId, roomNumber, roomType, userId, checkIn, checkOut, paymentType, totalAmount, paidAmount, paymentStatus, status, slipImage, guestCount, breakfastCount, dinnerCount, dinnerType, specialRequests) 
                VALUES (@bookingId, @guestName, @guestPhone, @roomId, @roomNumber, @roomType, @userId, @checkIn, @checkOut, @paymentType, @totalAmount, @paidAmount, @paymentStatus, @status, @slipImage, @guestCount, @breakfastCount, @dinnerCount, @dinnerType, @specialRequests);
                SELECT SCOPE_IDENTITY() AS id;
            `);
            
            const newBooking = {
                id: result.recordset[0].id,
                bookingId,
                guestName,
                guestPhone: guestPhone || null,
                roomId,
                roomNumber,
                roomType,
                userId,
                checkIn,
                checkOut,
                paymentType,
                totalAmount,
                paidAmount,
                paymentStatus,
                status,
                slipImage,
                guestCount: guestCount || 1,
                breakfastCount: breakfastCount || 0,
                dinnerCount: dinnerCount || 0,
                dinnerType: dinnerType || 'Small',
                specialRequests: specialRequests || '',
                createdAt: new Date().toISOString()
            };

            // --- Post-Booking Integrations (Async) ---
            // Don't wait for these to respond to client
            (async () => {
                // 1. Send Notifications
                await sendLineNotification(newBooking, slipImage);
                await sendTelegramNotification(newBooking, slipImage);

                // 2. Add to Google Calendar and update booking with event ID
                const eventId = await addToGoogleCalendar(newBooking);
                if (eventId) {
                    try {
                        const updateReq = pool.request();
                        updateReq.input('id', sql.Int, newBooking.id);
                        updateReq.input('googleEventId', sql.VarChar, eventId);
                        await updateReq.query('UPDATE bookings SET googleEventId = @googleEventId WHERE id = @id');
                    } catch (err) {
                        console.error('Failed to update booking with googleEventId:', err);
                    }
                }
            })();

            res.json({ success: true, message: 'Booking created successfully', data: newBooking });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Database error: ' + err.message });
        }
    } else {
        const newBooking = {
            id: BOOKINGS.length + 1,
            bookingId,
            roomId: Number(roomId),
            userId: userId || null,
            guestName,
            guestPhone: guestPhone || null,
            checkIn,
            checkOut,
            totalAmount: Number(totalAmount),
            paidAmount: Number(paidAmount || 0),
            paymentType: paymentType || 'Full',
            paymentStatus,
            status,
            slipImage,
            guestCount: guestCount || 1,
            breakfastCount: breakfastCount || 0,
            dinnerCount: dinnerCount || 0,
            dinnerType: dinnerType || 'Small',
            specialRequests: specialRequests || '',
            createdAt: new Date().toISOString()
        };
        BOOKINGS.push(newBooking);

        (async () => {
            await sendLineNotification(newBooking, slipImage);
            await sendTelegramNotification(newBooking, slipImage);
        })();

        res.json({ success: true, message: 'Booking created successfully', data: newBooking });
    }
});

// Update Booking
app.put('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const { roomId, checkIn, checkOut, totalAmount } = req.body;

    const pool = db.getPool();
    if (pool) {
        try {
            const request = pool.request();
            request.input('id', sql.Int, id);
            
            let query = "UPDATE bookings SET ";
            const updates = [];
            
            if(roomId) { 
                updates.push('roomId=@roomId'); 
                request.input('roomId', sql.Int, roomId);
            }
            if(checkIn) { 
                updates.push('checkIn=@checkIn'); 
                request.input('checkIn', sql.Date, checkIn);
            }
            if(checkOut) { 
                updates.push('checkOut=@checkOut'); 
                request.input('checkOut', sql.Date, checkOut);
            }
            if(totalAmount) { 
                updates.push('totalAmount=@totalAmount'); 
                request.input('totalAmount', sql.Decimal(10, 2), totalAmount);
            }
            
            if(updates.length > 0) {
                query += updates.join(', ') + " WHERE id=@id";
                await request.query(query);
            }
            res.json({ success: true, message: 'Booking updated successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        const bookingIndex = BOOKINGS.findIndex(b => b.id == id);
        if (bookingIndex === -1) return res.status(404).json({ success: false, message: 'Booking not found' });
        
        BOOKINGS[bookingIndex] = {
            ...BOOKINGS[bookingIndex],
            roomId: roomId ? Number(roomId) : BOOKINGS[bookingIndex].roomId,
            checkIn: checkIn || BOOKINGS[bookingIndex].checkIn,
            checkOut: checkOut || BOOKINGS[bookingIndex].checkOut,
            totalAmount: totalAmount || BOOKINGS[bookingIndex].totalAmount
        };
        res.json({ success: true, message: 'Booking updated successfully', data: BOOKINGS[bookingIndex] });
    }
});

// Cancel Booking
app.delete('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const pool = db.getPool();
    if (pool) {
        try {
            // Get booking details first to check for Google Event ID
            const getReq = pool.request();
            getReq.input('id', sql.Int, id);
            const bookingResult = await getReq.query('SELECT * FROM bookings WHERE id = @id');
            
            if (bookingResult.recordset.length > 0) {
                const booking = bookingResult.recordset[0];
                if (booking.googleEventId) {
                    // Delete from Google Calendar (Async)
                    deleteFromGoogleCalendar(booking.googleEventId).catch(console.error);
                }
            }

            const request = pool.request();
            request.input('id', sql.Int, id);
            await request.query('DELETE FROM bookings WHERE id = @id');
            res.json({ success: true, message: 'Booking cancelled successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        const bookingIndex = BOOKINGS.findIndex(b => b.id == id);
        if (bookingIndex === -1) return res.status(404).json({ success: false, message: 'Booking not found' });
        BOOKINGS.splice(bookingIndex, 1);
        res.json({ success: true, message: 'Booking cancelled successfully' });
    }
});

// --- Settings API ---
app.get('/api/settings/:key', async (req, res) => {
    const { key } = req.params;
    const pool = db.getPool();
    if (pool) {
        try {
            const result = await pool.request()
                .input('key', sql.VarChar, key)
                .query('SELECT value FROM settings WHERE [key] = @key');
            if (result.recordset.length > 0) {
                res.json({ success: true, value: result.recordset[0].value });
            } else {
                res.json({ success: true, value: null });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        // Mock Settings
        res.json({ success: true, value: null });
    }
});

app.post('/api/settings', async (req, res) => {
    const { key, value } = req.body;
    const pool = db.getPool();
    if (pool) {
        try {
            const request = pool.request();
            request.input('key', sql.VarChar, key);
            request.input('value', sql.VarChar(sql.MAX), value);
            
            // Upsert (Merge)
            await request.query(`
                MERGE settings AS target
                USING (SELECT @key AS [key], @value AS [value]) AS source
                ON (target.[key] = source.[key])
                WHEN MATCHED THEN
                    UPDATE SET value = source.[value]
                WHEN NOT MATCHED THEN
                    INSERT ([key], [value]) VALUES (source.[key], source.[value]);
            `);
            
            res.json({ success: true, message: 'Setting saved' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    } else {
        res.json({ success: true, message: 'Mock setting saved' });
    }
});

// Mock Database (Fallback)
