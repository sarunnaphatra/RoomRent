import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import SlipUploadModal from './SlipUploadModal';

const SettingsIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 9a3 3 0 100 6 3 3 0 000-6z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 13a7.96 7.96 0 00.1-1 7.96 7.96 0 00-.1-1l2-1.5a.5.5 0 00.1-.6l-1.9-3.3a.5.5 0 00-.6-.2l-2.3.9a7.2 7.2 0 00-1.7-1L14.5 2h-5l-.4 2.3a7.2 7.2 0 00-1.7 1l-2.3-.9a.5.5 0 00-.6.2L2.6 8.9a.5.5 0 00.1.6l2 1.5a7.96 7.96 0 00-.1 1 7.96 7.96 0 00.1 1l-2 1.5a.5.5 0 00-.1.6l1.9 3.3a.5.5 0 00.6.2l2.3-.9a7.2 7.2 0 001.7 1l.4 2.3h5l.4-2.3a7.2 7.2 0 001.7-1l2.3.9a.5.5 0 00.6-.2l1.9-3.3a.5.5 0 00-.1-.6L19.4 13z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8 2v4M16 2v4M3 10h18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 7h14M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 13h10l1-13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PhoneIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const RoomBooking = ({ user, receiptSettings }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]); // Store all bookings for availability check
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarRoom, setCalendarRoom] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [viewSlipImage, setViewSlipImage] = useState(null);
  
  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    id: null,
    guestName: '',
    guestPhone: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    paymentType: 'Full',
    guestCount: 1,
    breakfastCount: 0,
    dinnerCount: 0,
    dinnerType: 'Small',
    specialRequests: ''
  });

  // Room Form State
  const [roomForm, setRoomForm] = useState({
    id: null,
    number: '',
    type: 'Standard',
    price: '',
    image: '',
    status: 'Available'
  });

  const [loading, setLoading] = useState(false);

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    fetchRooms();
    fetchBookings();
    fetchQrSettings();
  }, [user]); // Re-fetch when user changes (login/logout)

  const fetchQrSettings = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:4455/api/settings/payment_qr_image');
      if (res.data.success && res.data.value) {
        setQrCodeImage(res.data.value);
      }
    } catch (err) {
      console.error('Failed to fetch QR settings', err);
    }
  };

  const fetchRooms = async () => {
    try {
      console.log('Fetching rooms...');
      const res = await axios.get('http://127.0.0.1:4455/api/rooms');
      console.log('Rooms fetched:', res.data);
      const roomsData = Array.isArray(res.data?.data) ? res.data.data : [];
      setRooms(roomsData);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setRooms([]);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:4455/api/bookings');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setAllBookings(data); 
      
      if (user?.username === 'admin') {
        setBookings(data);
      } else if (user?.id) {
        setBookings(data.filter(b => b.userId === user.id));
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookings([]);
      setAllBookings([]);
    }
  };

  const handleCalendarClick = (room) => {
    setCalendarRoom(room);
    setShowCalendarModal(true);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month' && calendarRoom) {
      const isBooked = allBookings.some(b => {
        if (b.roomId !== calendarRoom.id) return false;
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        return date >= checkIn && date < checkOut;
      });
      return isBooked ? 'text-red-600 font-bold' : 'text-green-600 font-bold';
    }
  };

  // --- Booking Logic ---

  const handleBookClick = (room) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setShowEditBookingModal(false);
    setSelectedRoom(null);
    setBookingForm({ 
        id: null, guestName: '', guestPhone: '', roomId: '', checkIn: '', checkOut: '', paymentType: 'Full',
        guestCount: 1, breakfastCount: 0, dinnerCount: 0, dinnerType: 'Small', specialRequests: ''
    });
  };

  const handleBookingInputChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    if (type === 'number') {
        newValue = Number(value);
        if (newValue < 0) newValue = 0;
    }

    if (name === 'checkIn') {
      const roomId = selectedRoom ? selectedRoom.id : Number(bookingForm.roomId || 0);
      if (roomId) {
        const roomBookings = allBookings.filter(b => b.roomId === roomId && b.id !== bookingForm.id);
        const selectedDate = new Date(value);
        selectedDate.setHours(0, 0, 0, 0);
        const isOccupied = roomBookings.some(b => {
          const checkIn = new Date(b.checkIn);
          const checkOut = new Date(b.checkOut);
          checkIn.setHours(0, 0, 0, 0);
          checkOut.setHours(0, 0, 0, 0);
          return selectedDate >= checkIn && selectedDate < checkOut;
        });
        if (isOccupied) {
          alert(t('dateOverlap'));
          return;
        }
      }
    }
    setBookingForm({ ...bookingForm, [name]: newValue });
  };

  // Check for date overlaps
  const isDateOverlap = (roomId, start, end, excludeBookingId = null) => {
    // Use allBookings instead of bookings to check against everyone's reservations
    const roomBookings = allBookings.filter(b => b.roomId === roomId && b.id !== excludeBookingId);
    const newStart = new Date(start);
    const newEnd = new Date(end);

    return roomBookings.some(b => {
        const bookedStart = new Date(b.checkIn);
        const bookedEnd = new Date(b.checkOut);
        // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
        // Using strict inequality for check-in/out days if they can't overlap at all
        // Usually hotels allow Check-out on same day as Check-in.
        // Logic: newStart < bookedEnd && newEnd > bookedStart
        return (newStart < bookedEnd && newEnd > bookedStart);
    });
  };

  const getRoomStatus = (room) => {
    if (room.status === 'Maintenance') return 'Maintenance';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOccupied = allBookings.some(b => {
        if (b.roomId !== room.id) return false;
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        return today >= checkIn && today < checkOut;
    });

    return isOccupied ? 'Booked' : 'Available';
  };

  // Get booked dates for display
  const getBookedDates = (roomId) => {
    return allBookings
        .filter(b => b.roomId === roomId)
        .map(b => `${b.checkIn} - ${b.checkOut}`)
        .join(', ');
  };

  const calculateTotal = (room = selectedRoom) => {
    if (!bookingForm.checkIn || !bookingForm.checkOut || !room) return 0;
    const start = new Date(bookingForm.checkIn);
    const end = new Date(bookingForm.checkOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays <= 0) return 0;

    let basePrice = diffDays * room.price;

    // Guest Surcharge (>5 people, +200 per person)
    const extraGuests = Math.max(0, (bookingForm.guestCount || 1) - 5);
    const guestSurcharge = extraGuests * 200;

    // Breakfast (+70 per set)
    const breakfastPrice = (bookingForm.breakfastCount || 0) * 70;

    // Dinner
    let dinnerPrice = 0;
    const dinnerCount = bookingForm.dinnerCount || 0;
    const dinnerType = bookingForm.dinnerType || 'Small';
    if (dinnerCount > 0) {
        if (dinnerType === 'Small') dinnerPrice = dinnerCount * 250;
        else if (dinnerType === 'Large') dinnerPrice = dinnerCount * 400;
    }

    return basePrice + guestSurcharge + breakfastPrice + dinnerPrice;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut) {
        alert(t('fillAll'));
        return;
    }

    if (new Date(bookingForm.checkOut) <= new Date(bookingForm.checkIn)) {
        alert(t('invalidDates'));
        return;
    }

    if (isDateOverlap(selectedRoom ? selectedRoom.id : Number(bookingForm.roomId), bookingForm.checkIn, bookingForm.checkOut, bookingForm.id)) {
        alert(t('dateOverlap'));
        return;
    }

    const total = calculateTotal(selectedRoom || rooms.find(r => r.id === Number(bookingForm.roomId)));
    
    // If Editing existing booking, just update without payment flow for now (or add logic if needed)
    if (bookingForm.id) {
        setLoading(true);
        try {
            await axios.put(`http://127.0.0.1:4455/api/bookings/${bookingForm.id}`, {
                ...bookingForm,
                totalAmount: total
            });
            alert(t('save'));
            handleCloseBookingModal();
            fetchBookings();
        } catch (err) {
            console.error(err);
            alert(t('error'));
        } finally {
            setLoading(false);
        }
        return;
    }

    // New Booking -> Payment Flow
    const paid = bookingForm.paymentType === 'Deposit' ? 500 : total;
    
    setPendingBooking({
        ...bookingForm,
        roomId: selectedRoom.id,
        totalAmount: total,
        paidAmount: paid,
        userId: user?.id
    });
    setShowBookingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    // Instead of immediately confirming, show slip upload modal
    setShowPaymentModal(false);
    setShowSlipModal(true);
  };

  const handleSlipUploadSuccess = async (slipImage) => {
    setLoading(true);
    try {
        const bookingData = { ...pendingBooking, slipImage };
        const res = await axios.post('http://127.0.0.1:4455/api/bookings', bookingData);
        
        if (res.data.success) {
            setReceiptData(res.data.data);
            setShowSlipModal(false);
            setShowReceiptModal(true);
            setPendingBooking(null);
            fetchBookings();
        }
    } catch (err) {
        console.error(err);
        alert('Booking failed');
    } finally {
        setLoading(false);
    }
  };

  const handleEditBookingClick = (booking) => {
    setBookingForm({
        id: booking.id,
        guestName: booking.guestName,
        guestPhone: booking.guestPhone || '',
        roomId: booking.roomId,
        checkIn: booking.checkIn ? booking.checkIn.toString().split('T')[0] : '',
        checkOut: booking.checkOut ? booking.checkOut.toString().split('T')[0] : ''
    });
    setSelectedRoom(rooms.find(r => r.id === booking.roomId));
    setShowEditBookingModal(true);
  };

  const handleCancelBookingClick = async (id) => {
    if (window.confirm(t('confirmCancelBooking'))) {
        try {
            await axios.delete(`http://127.0.0.1:4455/api/bookings/${id}`);
            fetchBookings();
        } catch (err) {
            console.error(err);
            alert(t('error'));
        }
    }
  };

  // --- Room Management Logic ---

  const handleAddRoomClick = () => {
    setRoomForm({ id: null, number: '', type: 'Standard', price: '', image: '', status: 'Available', images: [] });
    setShowRoomModal(true);
  };

  const handleEditRoomClick = async (room) => {
    setRoomForm({ ...room, images: room.images || [] });
    setShowRoomModal(true);

    try {
        const res = await axios.get(`http://127.0.0.1:4455/api/rooms/${room.id}/images`);
        if (res.data.success) {
            setRoomForm(prev => ({ ...prev, images: res.data.data }));
        }
    } catch (err) {
        console.error("Failed to load images for edit", err);
    }
  };

  const handleDeleteRoomClick = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
        try {
            await axios.delete(`http://127.0.0.1:4455/api/rooms/${id}`);
            fetchRooms();
        } catch (err) {
            console.error(err);
            alert(t('error'));
        }
    }
  };

  const handleCloseRoomModal = () => {
    setShowRoomModal(false);
  };

  const handleRoomInputChange = (e) => {
    setRoomForm({ ...roomForm, [e.target.name]: e.target.value });
  };

  const [galleryRoom, setGalleryRoom] = useState(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // ... (previous state definitions)

  // ... (previous useEffects)

  // ... (previous functions)

  const handleRoomImageClick = async (room) => {
    setGalleryRoom(room);
    setShowGalleryModal(true);

    try {
        const res = await axios.get(`http://127.0.0.1:4455/api/rooms/${room.id}/images`);
        if (res.data.success) {
            setGalleryRoom(prev => ({ ...prev, images: res.data.data }));
        }
    } catch (err) {
        console.error("Failed to load images", err);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.7 quality to reduce payload size
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
  };

  const handleRoomImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setLoading(true); // Show loading while compressing
      try {
          const promises = files.map(file => compressImage(file));
          const images = await Promise.all(promises);
          
          const currentImages = roomForm.images || [];
          const newImages = [...currentImages, ...images];
          
          setRoomForm({ 
              ...roomForm, 
              image: roomForm.image || images[0], // Set first as main if empty
              images: newImages
          });
      } catch (err) {
          console.error("Image compression failed", err);
          alert("Failed to process images");
      } finally {
          setLoading(false);
      }
    }
  };

  const removeImage = (index) => {
    const newImages = [...(roomForm.images || [])];
    const removedImage = newImages[index];
    newImages.splice(index, 1);
    
    // If the removed image was the Main Image, update it
    let newMainImage = roomForm.image;
    if (roomForm.image === removedImage) {
        newMainImage = newImages.length > 0 ? newImages[0] : '';
    }

    setRoomForm({ ...roomForm, images: newImages, image: newMainImage });
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (!roomForm.number || !roomForm.price) {
        alert(t('fillAll'));
        return;
    }

    setLoading(true);
    try {
        if (roomForm.id) {
            // Update
            await axios.put(`http://127.0.0.1:4455/api/rooms/${roomForm.id}`, roomForm);
        } else {
            // Create
            await axios.post('http://127.0.0.1:4455/api/rooms', roomForm);
        }
        handleCloseRoomModal();
        fetchRooms();
    } catch (err) {
        console.error(err);
        alert(t('error'));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('roomBooking')}</h1>
          {receiptSettings?.hotelName && (
            <p className="text-sm text-gray-500 mt-1">{receiptSettings.hotelName}</p>
          )}
        </div>
        {user?.username === 'admin' && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
            <button 
              onClick={handleAddRoomClick}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:shadow-md transition"
            >
              <PlusIcon />
              <span className="ml-2">{t('addRoom')}</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Rooms Grid */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('availableRooms')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col relative">
            <div className="relative h-64 cursor-pointer overflow-hidden" onClick={() => handleRoomImageClick(room)}>
                <img src={room.image} alt={room.type} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>

                {(room.totalImages > 1 || (room.images && room.images.length > 1)) && (
                    <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        +{Math.max((room.totalImages || room.images.length) - 1, 0)}
                    </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur text-gray-900 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {t('viewPhotos') || 'View Photos'}
                    </span>
                </div>
                
                <div className="absolute top-3 left-3 flex gap-2">
                     <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                        {room.type}
                     </span>
                     <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm text-white ${getRoomStatus(room) === 'Available' ? 'bg-emerald-500' : getRoomStatus(room) === 'Booked' ? 'bg-rose-500' : 'bg-gray-500'}`}>
                        {getRoomStatus(room) === 'Available' ? t('status_available') : getRoomStatus(room) === 'Booked' ? t('status_booked') : t('status_maintenance')}
                     </span>
                </div>
            </div>
            
            {/* Admin Actions Overlay - Improved visibility */}
            {user?.username === 'admin' && (
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                  <button 
                      onClick={(e) => { e.stopPropagation(); handleEditRoomClick(room); }}
                      className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm text-blue-600 hover:text-blue-800 hover:bg-white transition-all transform hover:scale-105"
                      title={t('editRoom')}
                  >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                  </button>
                  <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteRoomClick(room.id); }}
                      className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm text-red-600 hover:text-red-800 hover:bg-white transition-all transform hover:scale-105"
                      title={t('deleteRoom')}
                  >
                      <TrashIcon />
                  </button>
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {t('room')} {room.number}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {room.type} Suite
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">฿{room.price.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 font-medium">/{t('night')}</div>
                </div>
              </div>
              
              <div className="mt-auto grid grid-cols-4 gap-3 pt-4 border-t border-gray-50">
                <button 
                    onClick={() => handleCalendarClick(room)}
                    className="col-span-1 flex items-center justify-center p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors border border-indigo-100 group/cal"
                    title={t('availability')}
                >
                    <div className="transform group-hover/cal:scale-110 transition-transform">
                        <CalendarIcon />
                    </div>
                </button>
                <button 
                    onClick={() => handleBookClick(room)}
                    disabled={room.status === 'Maintenance'}
                    className={`col-span-3 py-3 rounded-xl font-bold shadow-md shadow-blue-100 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
                        room.status === 'Maintenance'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg hover:shadow-blue-200'
                    }`}
                >
                    {room.status === 'Maintenance' ? (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            {t('unavailable')}
                        </>
                    ) : (
                        <>
                            <span>{t('bookNow')}</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </>
                    )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('myBookings')}</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        {bookings.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <p className="text-lg font-medium">{t('noBookings')}</p>
                <p className="text-sm mt-1 text-gray-400">New bookings will appear here</p>
            </div>
        ) : (
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('bookingId')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('room')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('guestName')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('checkIn')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('checkOut')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('status')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('payment')}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('totalPrice')}</th>
                        {user?.username === 'admin' && <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('actions')}</th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50/80 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {booking.slipImage ? (
                                    <button 
                                        onClick={() => setViewSlipImage(booking.slipImage)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors text-xs font-medium"
                                        title={t('viewSlip')}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        {booking.bookingId || `#${booking.id}`}
                                    </button>
                                ) : (
                                    <span className="font-mono text-gray-400">{booking.bookingId || `#${booking.id}`}</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                                    {rooms.find(r => r.id === booking.roomId)?.number || booking.roomId}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{booking.guestName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(booking.checkIn)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(booking.checkOut)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                    booking.paymentStatus === 'Paid in Full' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                    booking.paymentStatus === 'Deposit Paid' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                                    'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                    {booking.paymentStatus === 'Paid in Full' ? t('paymentStatus_paidInFull') : 
                                     booking.paymentStatus === 'Deposit Paid' ? t('paymentStatus_depositPaid') : 
                                     booking.paymentStatus === 'Pending Payment' ? t('paymentStatus_pendingPayment') :
                                     t('paymentStatus_pending')}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between w-24">
                                        <span className="text-gray-400">{t('paid')}:</span>
                                        <span className="font-medium text-gray-700">฿{booking.paidAmount?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between w-24">
                                        <span className="text-gray-400">{t('remaining')}:</span>
                                        <span className="font-medium text-rose-500">฿{((booking.totalAmount || 0) - (booking.paidAmount || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">฿{booking.totalAmount.toLocaleString()}</td>
                            {user?.username === 'admin' && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleEditBookingClick(booking)}
                                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                            title={t('editBooking')}
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => handleCancelBookingClick(booking.id)}
                                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                            title={t('cancelBooking')}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

      {/* Edit Booking Modal */}
      {showEditBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
                onClick={handleCloseBookingModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-800">{t('editBooking')}</h3>
            
            <form onSubmit={handleBookingSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <UserIcon />
                        {t('guestName')}
                    </label>
                    <input 
                        type="text" 
                        name="guestName"
                        value={bookingForm.guestName}
                        onChange={handleBookingInputChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-gray-50 text-gray-500"
                        required
                        disabled
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <PhoneIcon />
                        {t('customerPhone')}
                    </label>
                    <input 
                        type="tel" 
                        name="guestPhone"
                        value={bookingForm.guestPhone}
                        onChange={handleBookingInputChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-gray-50 text-gray-500"
                        disabled
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('changeRoom')}</label>
                    <div className="relative">
                        <select 
                            name="roomId"
                            value={bookingForm.roomId}
                            onChange={handleBookingInputChange}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
                        >
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>
                                    {room.number} ({room.type}) - ฿{room.price}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                            <CalendarIcon />
                            {t('checkIn')}
                        </label>
                        <input 
                            type="date" 
                            name="checkIn"
                            value={bookingForm.checkIn}
                            onChange={handleBookingInputChange}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                            <CalendarIcon />
                            {t('checkOut')}
                        </label>
                        <input 
                            type="date" 
                            name="checkOut"
                            value={bookingForm.checkOut}
                            min={bookingForm.checkIn}
                            onChange={handleBookingInputChange}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
                    <span className="text-gray-700 font-medium">{t('newTotal')}</span>
                    <span className="text-xl font-bold text-blue-700">
                        ฿{calculateTotal(rooms.find(r => r.id === Number(bookingForm.roomId))).toLocaleString()}
                    </span>
                </div>

                {/* Additional Services */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        {t('additionalServices')}
                    </h4>
                    
                    {/* Guest Count */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900">{t('guestCount')}</label>
                                <div className="text-xs text-gray-500 mt-0.5">{t('guestCountDesc')}</div>
                            </div>
                            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                                <button 
                                    type="button"
                                    onClick={() => setBookingForm(prev => ({...prev, guestCount: Math.max(1, (prev.guestCount || 1) - 1)}))}
                                    className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                                </button>
                                <span className="w-10 text-center font-semibold text-gray-900">{bookingForm.guestCount || 1}</span>
                                <button 
                                    type="button"
                                    onClick={() => setBookingForm(prev => ({...prev, guestCount: (prev.guestCount || 1) + 1}))}
                                    className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                        </div>
                        {(bookingForm.guestCount > 5) && (
                            <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                {t('extraBedInfo', { count: bookingForm.guestCount - 5 })}
                            </div>
                        )}
                    </div>

                    {/* Breakfast */}
                    <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900">{t('breakfast')}</label>
                            <div className="text-xs text-gray-500 mt-0.5">{t('breakfastDesc')}</div>
                        </div>
                        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                            <button 
                                type="button"
                                onClick={() => setBookingForm(prev => ({...prev, breakfastCount: Math.max(0, (prev.breakfastCount || 0) - 1)}))}
                                className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                            </button>
                            <span className="w-10 text-center font-semibold text-gray-900">{bookingForm.breakfastCount || 0}</span>
                            <button 
                                type="button"
                                onClick={() => setBookingForm(prev => ({...prev, breakfastCount: (prev.breakfastCount || 0) + 1}))}
                                className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Dinner */}
                    <div className="p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900">{t('dinner')}</label>
                                <div className="text-xs text-gray-500 mt-0.5">{t('dinnerDesc')}</div>
                            </div>
                            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                                <button 
                                    type="button"
                                    onClick={() => setBookingForm(prev => ({...prev, dinnerCount: Math.max(0, (prev.dinnerCount || 0) - 1)}))}
                                    className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                                </button>
                                <span className="w-10 text-center font-semibold text-gray-900">{bookingForm.dinnerCount || 0}</span>
                                <button 
                                    type="button"
                                    onClick={() => setBookingForm(prev => ({...prev, dinnerCount: (prev.dinnerCount || 0) + 1}))}
                                    className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                        </div>
                        
                        {(bookingForm.dinnerCount > 0) && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <label className={`cursor-pointer relative p-3 rounded-lg border-2 transition-all ${bookingForm.dinnerType === 'Small' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="dinnerType" 
                                        value="Small" 
                                        checked={bookingForm.dinnerType === 'Small'} 
                                        onChange={handleBookingInputChange}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`text-sm font-medium ${bookingForm.dinnerType === 'Small' ? 'text-blue-700' : 'text-gray-600'}`}>{t('smallSet')}</span>
                                    </div>
                                    {bookingForm.dinnerType === 'Small' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></div>}
                                </label>
                                <label className={`cursor-pointer relative p-3 rounded-lg border-2 transition-all ${bookingForm.dinnerType === 'Large' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="dinnerType" 
                                        value="Large" 
                                        checked={bookingForm.dinnerType === 'Large'} 
                                        onChange={handleBookingInputChange}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`text-sm font-medium ${bookingForm.dinnerType === 'Large' ? 'text-blue-700' : 'text-gray-600'}`}>{t('largeSet')}</span>
                                    </div>
                                    {bookingForm.dinnerType === 'Large' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></div>}
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Special Requests */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('specialRequests')}</label>
                        <textarea 
                            name="specialRequests"
                            value={bookingForm.specialRequests || ''}
                            onChange={handleBookingInputChange}
                            placeholder={t('specialRequestsPlaceholder')}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow shadow-sm"
                            rows="2"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        type="button" 
                        onClick={handleCloseBookingModal}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold disabled:bg-blue-300 flex justify-center items-center gap-2 shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98]"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>{t('saving') || 'Saving...'}</span>
                            </>
                        ) : t('save')}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal (Create) */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
                onClick={handleCloseBookingModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
                {t('bookNow')} <span className="text-gray-400 font-normal text-lg">|</span> {t('room')} {selectedRoom.number}
                <div className="text-sm font-medium text-blue-600 mt-1 bg-blue-50 inline-block px-3 py-1 rounded-full">
                    ฿{selectedRoom.price.toLocaleString()} <span className="text-blue-400">/ {t('night')}</span>
                </div>
            </h3>
            
            <form onSubmit={handleBookingSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <UserIcon />
                        {t('guestName')}
                    </label>
                    <input 
                        type="text" 
                        name="guestName"
                        value={bookingForm.guestName}
                        onChange={handleBookingInputChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-gray-50 focus:bg-white"
                        placeholder="John Doe"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <PhoneIcon />
                        {t('customerPhone')}
                    </label>
                    <input 
                        type="tel" 
                        name="guestPhone"
                        value={bookingForm.guestPhone}
                        onChange={handleBookingInputChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-gray-50 focus:bg-white"
                        placeholder="0812345678"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                            <CalendarIcon />
                            {t('checkIn')}
                        </label>
                        <input 
                            type="date" 
                            name="checkIn"
                            value={bookingForm.checkIn}
                            onChange={handleBookingInputChange}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                            <CalendarIcon />
                            {t('checkOut')}
                        </label>
                        <input 
                            type="date" 
                            name="checkOut"
                            value={bookingForm.checkOut}
                            min={bookingForm.checkIn}
                            onChange={handleBookingInputChange}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
                    <span className="text-gray-700 font-medium">{t('totalPrice')}</span>
                    <span className="text-xl font-bold text-blue-700">฿{calculateTotal().toLocaleString()}</span>
                </div>

                {/* Additional Services */}
                <div className="space-y-6 pt-6 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        {t('additionalServices')}
                    </h4>
                    
                    {/* Guest Count */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900">{t('guestCount')}</label>
                                <div className="text-xs text-gray-500 mt-0.5">{t('guestCountDesc')}</div>
                            </div>
                            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                                <button 
                                    type="button"
                                    onClick={() => setBookingForm(prev => ({...prev, guestCount: Math.max(1, (prev.guestCount || 1) - 1)}))}
                                    className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                                </button>
                                <span className="w-10 text-center font-semibold text-gray-900">{bookingForm.guestCount || 1}</span>
                                <button 
                                    type="button"
                                    onClick={() => setBookingForm(prev => ({...prev, guestCount: (prev.guestCount || 1) + 1}))}
                                    className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                        </div>
                        {(bookingForm.guestCount > 5) && (
                            <div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                {t('extraBedInfo', { count: bookingForm.guestCount - 5 })}
                            </div>
                        )}
                    </div>

                    {/* Breakfast */}
                    <div className="flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900">{t('breakfast')}</label>
                            <div className="text-xs text-gray-500 mt-0.5">{t('breakfastDesc')}</div>
                        </div>
                        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                            <button 
                                type="button"
                                onClick={() => setBookingForm(prev => ({...prev, breakfastCount: Math.max(0, (prev.breakfastCount || 0) - 1)}))}
                                className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                            </button>
                            <span className="w-10 text-center font-semibold text-gray-900">{bookingForm.breakfastCount || 0}</span>
                            <button 
                                type="button"
                                onClick={() => setBookingForm(prev => ({...prev, breakfastCount: (prev.breakfastCount || 0) + 1}))}
                                className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Dinner */}
                    <div className="p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900">{t('dinner')}</label>
                                <div className="text-xs text-gray-500 mt-0.5">{t('dinnerDesc')}</div>
                            </div>
                            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                                <button 
                                    type="button"
                                    onClick={() => setBookingForm(prev => ({...prev, dinnerCount: Math.max(0, (prev.dinnerCount || 0) - 1)}))}
                                    className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                                </button>
                                <span className="w-10 text-center font-semibold text-gray-900">{bookingForm.dinnerCount || 0}</span>
                                <button 
                                    type="button"
                                    onClick={() => setBookingForm(prev => ({...prev, dinnerCount: (prev.dinnerCount || 0) + 1}))}
                                    className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                        </div>
                        
                        {(bookingForm.dinnerCount > 0) && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <label className={`cursor-pointer relative p-3 rounded-lg border-2 transition-all ${bookingForm.dinnerType === 'Small' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="dinnerType" 
                                        value="Small" 
                                        checked={bookingForm.dinnerType === 'Small'} 
                                        onChange={handleBookingInputChange}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`text-sm font-medium ${bookingForm.dinnerType === 'Small' ? 'text-blue-700' : 'text-gray-600'}`}>{t('smallSet')}</span>
                                    </div>
                                    {bookingForm.dinnerType === 'Small' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></div>}
                                </label>
                                <label className={`cursor-pointer relative p-3 rounded-lg border-2 transition-all ${bookingForm.dinnerType === 'Large' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="dinnerType" 
                                        value="Large" 
                                        checked={bookingForm.dinnerType === 'Large'} 
                                        onChange={handleBookingInputChange}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`text-sm font-medium ${bookingForm.dinnerType === 'Large' ? 'text-blue-700' : 'text-gray-600'}`}>{t('largeSet')}</span>
                                    </div>
                                    {bookingForm.dinnerType === 'Large' && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></div>}
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Special Requests */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('specialRequests')}</label>
                        <textarea 
                            name="specialRequests"
                            value={bookingForm.specialRequests || ''}
                            onChange={handleBookingInputChange}
                            placeholder={t('specialRequestsPlaceholder')}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow shadow-sm"
                            rows="2"
                        />
                    </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-3 pt-4">
                    <label className="block text-sm font-semibold text-gray-900">{t('selectPayment')}</label>
                    <div className="grid grid-cols-1 gap-3">
                        <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingForm.paymentType === 'Full' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <input 
                                type="radio" 
                                name="paymentType" 
                                value="Full" 
                                checked={bookingForm.paymentType === 'Full'}
                                onChange={handleBookingInputChange}
                                className="sr-only"
                            />
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-semibold text-gray-900">{t('fullPayment')}</div>
                                    {bookingForm.paymentType === 'Full' && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {t('totalPrice')} <span className="font-bold text-blue-600">฿{calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>
                        </label>
                        
                        <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingForm.paymentType === 'Deposit' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <input 
                                type="radio" 
                                name="paymentType" 
                                value="Deposit" 
                                checked={bookingForm.paymentType === 'Deposit'}
                                onChange={handleBookingInputChange}
                                className="sr-only"
                            />
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-semibold text-gray-900">{t('deposit')}</div>
                                    {bookingForm.paymentType === 'Deposit' && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>}
                                </div>
                                <div className="text-sm text-gray-500">
                                    ฿500 <span className="text-xs text-gray-400">({t('remainingBalance')} ฿{(calculateTotal() - 500).toLocaleString()})</span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        type="button" 
                        onClick={handleCloseBookingModal}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold disabled:bg-blue-300 flex justify-center items-center gap-2 shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98]"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>{t('processing') || 'Processing...'}</span>
                            </>
                        ) : t('confirmBooking')}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal (QR Code) */}
      {showPaymentModal && pendingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 relative text-center max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-2">{t('scanToPay')}</h3>
            <p className="text-gray-600 mb-4">{t('pleaseScanQR')}</p>
            
            <div className="bg-gray-100 p-4 rounded-lg inline-block mb-4 max-w-full">
                {/* Placeholder QR Code */}
                <img 
                    src={qrCodeImage || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Payment-${pendingBooking.totalAmount}`} 
                    alt="Payment QR Code" 
                    className="w-auto h-auto max-w-full max-h-[500px] mx-auto object-contain"
                />
            </div>
            
            <div className="mb-6 space-y-1">
                <div className="text-gray-500 text-sm">{t('amountToPay')}</div>
                <div className="text-3xl font-bold text-blue-600">฿{pendingBooking.paidAmount.toLocaleString()}</div>
                {pendingBooking.paymentType === 'Deposit' && (
                    <div className="text-xs text-orange-500 font-medium">
                        {t('remainingBalance')}: ฿{(pendingBooking.totalAmount - pendingBooking.paidAmount).toLocaleString()}
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={() => {
                        setShowPaymentModal(false);
                        setPendingBooking(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                    {t('cancel')}
                </button>
                <button 
                    onClick={handlePaymentConfirm}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow-lg shadow-green-200 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2"
                    disabled={loading}
                >
                    {loading ? (
                         <>
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             <span>{t('processing') || 'Processing...'}</span>
                         </>
                    ) : t('confirmPayment')}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Upload Modal */}
      {showSlipModal && pendingBooking && (
        <SlipUploadModal 
            bookingId="temp" // We upload slip first, then create booking. Or we can create booking first. 
                             // Current flow: Create booking AFTER payment.
                             // So we might need to adjust backend to accept slip with booking creation or separate.
                             // For now, let's just simulate the flow and call success.
            onClose={() => setShowSlipModal(false)}
            onUploadSuccess={handleSlipUploadSuccess}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <button 
                onClick={() => {
                    setShowReceiptModal(false);
                    setReceiptData(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 print:hidden transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="border-b-2 border-gray-100 pb-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{t('receiptHeader')}</h2>
                        <p className="text-gray-500 text-sm mt-1">อุ้ยคำแปง โฮมสเตย์ (ติดต่อ-สอบถาม โทร 053-111111)</p>
                        <p className="text-gray-500 text-sm">67/1 หมู่ 5 ต.เชียงกลาง อ.เชียงกลาง จ.น่าน ปณ.55160</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">{t('bookingId')}</div>
                        <div className="text-lg font-bold text-blue-600">{receiptData.bookingId}</div>
                        <div className="text-xs text-gray-400 mt-1">{formatDate(receiptData.createdAt)}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">{t('guestName')}</span>
                    <span className="font-semibold">{receiptData.guestName}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">{t('customerPhone')}</span>
                    <span className="font-semibold">{receiptData.guestPhone || '-'}</span>
                </div>
                
                <div className="border border-gray-100 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">{t('bookingDetails')}</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-gray-500">{t('room')}</div>
                        <div className="text-right font-medium">
                            {receiptData.roomNumber ? `${receiptData.roomNumber} (${receiptData.roomType})` : 
                             rooms.find(r => r.id === receiptData.roomId)?.number + ' (' + rooms.find(r => r.id === receiptData.roomId)?.type + ')'}
                        </div>
                        
                        <div className="text-gray-500">{t('checkIn')}</div>
                        <div className="text-right font-medium">
                            {formatDate(receiptData.checkIn)}
                            <div className="text-xs text-gray-500">เวลา 14.00 น.</div>
                        </div>
                        
                        <div className="text-gray-500">{t('checkOut')}</div>
                        <div className="text-right font-medium">
                            {formatDate(receiptData.checkOut)}
                            <div className="text-xs text-gray-500">เวลา 12.00 น.</div>
                        </div>
                    </div>
                </div>

                {/* Additional Services */}
                {(receiptData.guestCount > 5 || receiptData.breakfastCount > 0 || receiptData.dinnerCount > 0) && (
                    <div className="border border-gray-100 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">บริการเพิ่มเติม</h4>
                        <div className="space-y-2 text-sm">
                            {receiptData.guestCount > 5 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">จำนวนผู้เข้าพัก (เสริม {receiptData.guestCount - 5} ท่าน)</span>
                                    <span className="font-medium">{receiptData.guestCount} ท่าน</span>
                                </div>
                            )}
                            {receiptData.breakfastCount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">อาหารเช้า</span>
                                    <span className="font-medium">{receiptData.breakfastCount} ชุด</span>
                                </div>
                            )}
                            {receiptData.dinnerCount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">อาหารเย็น ({receiptData.dinnerType === 'Large' ? 'เซ็ตใหญ่' : 'เซ็ตเล็ก'})</span>
                                    <span className="font-medium">{receiptData.dinnerCount} ชุด</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="border border-gray-100 rounded-lg p-4">
                     <h4 className="font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">{t('payment')}</h4>
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{t('totalPrice')}</span>
                            <span className="font-medium">฿{receiptData.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{t('paid')} ({receiptData.paymentStatus === 'Paid in Full' ? t('paymentStatus_paidInFull') : 
                                receiptData.paymentStatus === 'Deposit Paid' ? t('paymentStatus_depositPaid') : 
                                receiptData.paymentStatus === 'Pending Payment' ? t('paymentStatus_pendingPayment') :
                                t('paymentStatus_pending')})</span>
                            <span className="font-medium text-green-600">- ฿{receiptData.paidAmount.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 my-2 pt-2 flex justify-between items-center">
                            <span className="font-semibold text-gray-700">{t('remainingBalance')} ({t('payAtCheckIn')})</span>
                            <span className="text-xl font-bold text-red-500">
                                ฿{(receiptData.totalAmount - receiptData.paidAmount).toLocaleString()}
                            </span>
                        </div>
                     </div>
                </div>
            </div>

            <div className="text-center space-y-3">
                <p className="text-xs text-gray-400">
                    {t('thankYouMessage')}
                </p>
                <button 
                    onClick={() => window.print()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-lg print:hidden"
                >
                    🖨️ {t('printReceipt')}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Management Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
                onClick={handleCloseRoomModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
                ✕
            </button>
            <h3 className="text-2xl font-bold mb-4">
                {roomForm.id ? t('editRoom') : t('addRoom')}
            </h3>
            
            <form onSubmit={handleRoomSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('roomNo')}</label>
                    <input 
                        type="text" 
                        name="number"
                        value={roomForm.number}
                        onChange={handleRoomInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('type')}</label>
                    <select 
                        name="type"
                        value={roomForm.type}
                        onChange={handleRoomInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="Standard">Standard</option>
                        <option value="Deluxe">Deluxe</option>
                        <option value="Suite">Suite</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')}</label>
                    <input 
                        type="number" 
                        name="price"
                        value={roomForm.price}
                        onChange={handleRoomInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('imageUrl')}</label>
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            name="image"
                            value={roomForm.image}
                            onChange={handleRoomInputChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="https://..."
                        />
                        <div className="text-center text-sm text-gray-500">- OR -</div>
                        <input 
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleRoomImageUpload}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {/* Image Previews */}
                        {roomForm.images && roomForm.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {roomForm.images.map((img, idx) => (
                                    <div key={idx} className="relative h-16 w-16 group">
                                        <img src={img} alt={`Preview ${idx}`} className="h-full w-full object-cover rounded border" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                        {roomForm.image === img && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[10px] text-center bg-opacity-80">
                                                Main
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
                    <select 
                        name="status"
                        value={roomForm.status}
                        onChange={handleRoomInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="Available">Available</option>
                        <option value="Booked">Booked</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        type="button" 
                        onClick={handleCloseRoomModal}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex justify-center items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>{loading ? '...' : t('save')}</span>
                            </>
                        ) : (loading ? '...' : t('save'))}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && calendarRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 relative">
             <button
                onClick={() => setShowCalendarModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
                ✕
            </button>
            <h3 className="text-2xl font-bold mb-4 text-center">{t('room')} {calendarRoom.number} - {t('availability')}</h3>
            <div className="flex justify-center">
                <Calendar
                    tileClassName={tileClassName}
                    minDate={new Date()}
                    className="rounded-lg shadow border-none"
                    locale="en-GB"
                />
            </div>
            <div className="mt-4 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span>{t('status_available')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span>{t('status_booked')}</span>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && galleryRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50" onClick={() => setShowGalleryModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-4 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button 
                onClick={() => setShowGalleryModal(false)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 z-10"
            >
                ✕
            </button>
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">{galleryRoom.type} - {t('room')} {galleryRoom.number}</h3>
                
                {/* Main Large Image */}
                <div className="w-full h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                        src={galleryRoom.image} 
                        alt="Main" 
                        className="max-w-full max-h-full object-contain"
                    />
                </div>

                {/* Thumbnails */}
                {galleryRoom.images && galleryRoom.images.length > 0 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 overflow-x-auto pb-2">
                        {galleryRoom.images.map((img, idx) => (
                            <div 
                                key={idx} 
                                className={`cursor-pointer border-2 rounded-lg overflow-hidden h-16 md:h-20 ${galleryRoom.image === img ? 'border-blue-500' : 'border-transparent'}`}
                                onClick={() => setGalleryRoom({...galleryRoom, image: img})}
                            >
                                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewSlipImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setViewSlipImage(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-2 relative" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => setViewSlipImage(null)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 bg-white rounded-full p-1 shadow-md"
                >
                    ✕
                </button>
                <img src={viewSlipImage} alt="Payment Slip" className="w-full h-auto rounded-lg" />
            </div>
        </div>
      )}
    </div>
  );
};

export default RoomBooking;
