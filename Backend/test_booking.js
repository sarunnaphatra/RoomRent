const axios = require('axios');

async function testBooking() {
    try {
        const response = await axios.post('http://localhost:3000/api/bookings', {
            bookingId: "TEST-006",
            roomId: 1,
            checkIn: "2026-02-18",
            checkOut: "2026-02-19",
            guestName: "Test User 6",
            guestPhone: "0812345678",
            totalAmount: 1000,
            paidAmount: 1000,
            paymentStatus: "Paid in Full",
            status: "Confirmed",
            guestCount: 2
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testBooking();
