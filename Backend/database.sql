-- Create Database (SQL Server / T-SQL)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'room_booking_db')
BEGIN
    CREATE DATABASE room_booking_db;
END
GO

USE room_booking_db;
GO

-- Users Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Insert Admin User (Idempotent)
IF NOT EXISTS (SELECT * FROM users WHERE username = 'admin')
BEGIN
    INSERT INTO users (username, password, role) VALUES ('admin', 'password', 'admin');
END
GO

-- Rooms Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[rooms]') AND type in (N'U'))
BEGIN
    CREATE TABLE rooms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        number VARCHAR(20) NOT NULL,
        type VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(MAX),
        status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Booked', 'Maintenance')),
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Insert Mock Rooms
IF NOT EXISTS (SELECT * FROM rooms)
BEGIN
    INSERT INTO rooms (number, type, price, image, status) VALUES 
    ('101', 'Standard', 1000.00, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=60', 'Available'),
    ('102', 'Standard', 1000.00, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=60', 'Available'),
    ('201', 'Deluxe', 2500.00, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=60', 'Available'),
    ('202', 'Deluxe', 2500.00, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=500&q=60', 'Available'),
    ('301', 'Suite', 5000.00, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=500&q=60', 'Available');
END
GO

-- Bookings Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[bookings]') AND type in (N'U'))
BEGIN
    CREATE TABLE bookings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        bookingId VARCHAR(50),
        guestName VARCHAR(100) NOT NULL,
        guestPhone VARCHAR(20),
        roomId INT NOT NULL,
        userId INT,
        checkIn DATE NOT NULL,
        checkOut DATE NOT NULL,
        paymentType VARCHAR(20) DEFAULT 'Full' CHECK (paymentType IN ('Full', 'Deposit')),
        totalAmount DECIMAL(10, 2) NOT NULL,
        paidAmount DECIMAL(10, 2) DEFAULT 0,
        paymentStatus VARCHAR(50) DEFAULT 'Pending',
        status VARCHAR(20) DEFAULT 'Confirmed',
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    );
END
GO

-- Add slipImage column if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[bookings]') AND name = 'slipImage')
BEGIN
    ALTER TABLE bookings ADD slipImage VARCHAR(MAX);
END
GO

-- Add guestPhone column if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[bookings]') AND name = 'guestPhone')
BEGIN
    ALTER TABLE bookings ADD guestPhone VARCHAR(20);
END
GO

-- Add googleEventId column if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[bookings]') AND name = 'googleEventId')
BEGIN
    ALTER TABLE bookings ADD googleEventId VARCHAR(255);
END
GO

-- Add roomNumber and roomType columns if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[bookings]') AND name = 'roomNumber')
BEGIN
    ALTER TABLE bookings ADD roomNumber VARCHAR(50);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[bookings]') AND name = 'roomType')
BEGIN
    ALTER TABLE bookings ADD roomType VARCHAR(50);
END
GO

-- Settings Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[settings]') AND type in (N'U'))
BEGIN
    CREATE TABLE settings (
        [key] VARCHAR(50) PRIMARY KEY,
        [value] VARCHAR(MAX)
    );
END
GO

-- Insert Default Settings
IF NOT EXISTS (SELECT * FROM settings WHERE [key] = 'payment_qr_image')
    INSERT INTO settings ([key], [value]) VALUES ('payment_qr_image', '');
GO

IF NOT EXISTS (SELECT * FROM settings WHERE [key] = 'line_notify_token')
    INSERT INTO settings ([key], [value]) VALUES ('line_notify_token', '');
GO

IF NOT EXISTS (SELECT * FROM settings WHERE [key] = 'line_chat_id')
    INSERT INTO settings ([key], [value]) VALUES ('line_chat_id', '');
GO

IF NOT EXISTS (SELECT * FROM settings WHERE [key] = 'telegram_bot_token')
    INSERT INTO settings ([key], [value]) VALUES ('telegram_bot_token', '');
GO

IF NOT EXISTS (SELECT * FROM settings WHERE [key] = 'telegram_chat_id')
    INSERT INTO settings ([key], [value]) VALUES ('telegram_chat_id', '');
GO

IF NOT EXISTS (SELECT * FROM settings WHERE [key] = 'google_calendar_id')
    INSERT INTO settings ([key], [value]) VALUES ('google_calendar_id', 's2.sarunnaphatra@gmail.com');
GO

IF NOT EXISTS (SELECT * FROM settings WHERE [key] = 'google_service_account_json')
    INSERT INTO settings ([key], [value]) VALUES ('google_service_account_json', '');
GO

-- Room Images Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[room_images]') AND type in (N'U'))
BEGIN
    CREATE TABLE room_images (
        id INT IDENTITY(1,1) PRIMARY KEY,
        room_id INT NOT NULL,
        image_data VARCHAR(MAX) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
END
GO
