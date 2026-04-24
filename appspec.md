# 🚨 AI AGENT INSTRUCTIONS (STRICT)
**Objective:** Generate Playwright automation scripts based on this document.
**Critical Constraints for Code Generation (Fixing Timeout & Selector Issues):**
1.  **Browser**: Configure `playwright.config.ts` to run **ONLY on Chromium**. (Disable Firefox/WebKit).
2.  **Selectors**: 
    * **NEVER** use brittle text selectors like `text='Login'` or `text='เข้าสู่ระบบ'`.
    * **NEVER** use `getByRole('main')` (The app uses `<div>` structure, not semantic `<main>`).
    * **ALWAYS** use robust locators: `getByRole('button', { name: /login|เข้าสู่ระบบ/i })` or `data-testid`.
    * **Page Load Check**: Instead of waiting for 'main', wait for **`getByRole('heading').first()`** or **`page.locator('img').first()`** to confirm content visibility.
    * **Wait Strategy**: ALWAYS insert `await expect(locator).toBeVisible()` before clicking.
3.  **Base URL**: `http://localhost:4433/` (Match with PRD Section 1).
4.  **Login Logic**: Handle the "Language Toggle" check or use Regex to match buttons regardless of language.


# Product Requirements Document (PRD) - Room Booking System (Complete Master)
## 1. Introduction
**Project Name:** RoomBookingApp
**Description:** A comprehensive web application for managing room reservations, designed with a modern UI/UX, supporting Thai and English languages. The system supports both Administrators (for management) and Customers (for self-service booking).
**Platform:** Web Application
**Frontend Host:** http://localhost:4433/
**Backend Host:** http://localhost:4455/

## 2. User Roles
### 2.1 Admin (Administrator)
- **Credentials:** `username: admin`, `password: password`
- **Privileges:**
  - Full access to all features.
  - Exclusive right to **Add, Edit, and Delete Rooms**.
  - Exclusive right to **View, Edit, and Cancel ALL Bookings**.
  - Exclusive right to **Configure Database Connection** via UI.
  - Exclusive right to **Configure Payment QR Code** (Upload/Change image).
  - Can view all customer bookings and slips.

### 2.2 Customer (General User)
- **Access:** Requires Registration and Login.
- **Registration Data:** Username, Password, Name, **Phone Number (Required)**.
- **Privileges:**
  - View available rooms and gallery.
  - Check room availability via Calendar view.
  - Make new bookings (Self-service).
  - Upload Payment Slip.
  - View **ONLY their own booking history**.
  - View Payment Receipt and uploaded Slip.

## 3. Functional Requirements

### 3.1 Authentication & User Management
- **Login Screen:**
  - Fields: Username, Password.
  - Language Toggle: Switch between TH/EN (App displays language based on this option).
- **Registration:**
  - Allow new customers to register.
  - Must capture **Phone Number** for contact purposes.

### 3.2 Room Management (Admin Only)
- **Access Control:** "Add", "Edit", "Delete" buttons visible only to `admin`.
- **CRUD Operations:**
  - **Add Room:** Create new rooms (Number, Type, Price, Main Image).
  - **Edit Room:** Update details, change status.
  - **Delete Room:** Remove rooms (Constraint: Cannot delete if active bookings exist, unless force cleared).
- **Image Handling:**
  - Support uploading **multiple images** directly from the device.
  - Display additional images in a gallery view when a room is clicked.
- **Mock Data:** System initializes with **10 Mock rooms** ranging from budget to luxury.

### 3.3 Booking System & Logic
- **Room Availability:**
  - Status is dynamic based on date. (e.g., Room A is booked on 02/02/2026, but available on 27/01/2026).
  - **Calendar View:** Users click a room to see a calendar.
    - **Green:** Available.
    - **Red:** Unavailable/Booked.
- **Booking Flow:**
  1. User selects Room.
  2. User selects Check-in and Check-out dates.
  3. **Validation:**
     - Check-out date must be greater than Check-in date.
     - **Overlap Check:** If dates overlap with existing booking -> Show **Popup Alert**: "The selected dates are already booked."
     - **"Book" Button:** Always clickable to allow checking availability, but blocks submission if invalid.
  4. **Payment:** User scans QR Code.
  5. **Slip Upload:** Post-payment, show **Popup to upload Slip**.
  6. **Confirmation:** System generates Booking ID and Receipt.

### 3.4 Payment & Receipt
- **QR Code:** Admin can change the QR Code image via Settings.
- **Receipt Display:** After booking, show a digital receipt containing:
  - Booking ID (Clickable in history to view Slip).
  - Customer Name & **Phone Number**.
  - Room Details & Booking Dates (**dd-MM-yyyy** format).
  - Total Amount & Outstanding Balance (if any).
  - Tax Invoice style summary (Hotel Name/Address).
- **Slip Storage:** Database must store the slip image path linked to the booking.

### 3.5 Booking History & Management
- **Customer View:** See own bookings. Click Booking ID to view the uploaded Slip.
- **Admin View:** See all bookings. Can Edit (Change Room/Dates) or Cancel/Delete bookings.
- **Cancellation:**
  - If a booking is cancelled, the dates must become available immediately.
  - Trigger removal of the event from Google Calendar.

### 3.6 System Configuration (Admin Only)
- **Database Connection UI:** Interface to configure DB Host, User, Pass, DB Name (Persistent connection, No timeout).
- **Payment Settings:** UI to upload/change Payment QR Code.

## 4. Technical Architecture
- **Directory Structure:**
  - `/Frontend` (React + Vite + Tailwind) -> **Port 4455**
  - `/Backend` (Node.js + Express) -> **Port 3000**
- **Database:** MSSQL (Must support persistent connection).
- **Date Formatting:** Display all dates as **dd-MM-yyyy**. Do **NOT** show `T00:00:00.000Z`.
- **Testing Stack:** Playwright (Chromium ONLY).

## 5. Integrations & Logic
### 5.1 Google Calendar
- **Calendar ID:** `s2.sarunnaphatra@gmail.com`
- **Action:**
  - On Booking Confirm: Create Event (Name: Customer Name, Desc: Room No + Phone).
  - On Booking Cancel: Delete Event.

### 5.2 Notifications (LINE & Telegram)
- **Trigger:** When customer uploads slip/confirms booking.
- **Content:** Send Booking Details (Receipt info) + **Image of the Slip**.

## 6. UI/UX Design Guidelines
- **Style:** Modern, Clean, Hotel-style aesthetic.
- **Icons:** Use modern icon sets (e.g., Lucide-React or Heroicons).
- **Responsiveness:** Fully responsive for Mobile/Tablet/Desktop.
- **Language:** Dynamic TH/EN switching for all labels and statuses.

---

## 7. Technical Data & Configuration (Secrets)

### 7.1 Database Configuration
- **Host:** `PEPPER`
- **Database:** `room_booking_db`
- **User:** `sa`
- **Password:** `123456`

### 7.2 Hotel Info (For Receipt)
- **Hotel Name:** `Test Hotel Name (053-102-999)`
- **Hotel Address:** `999/99 ต.ป่าตัน อ.เมือง จ.เชียงใหม่ ปณ. 50000`

### 7.3 Google Service Account (JSON)
*Save this as `service-account.json` in Backend.*
```json
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "YOUR_CLIENT_EMAIL",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "YOUR_CLIENT_X509_CERT_URL",
  "universe_domain": "googleapis.com"
}
```

### 7.4 Notification Keys
- **LINE Notify Token:** `YOUR_LINE_NOTIFY_TOKEN`
- **LINE Chat ID:** `YOUR_LINE_CHAT_ID`
- **Telegram Bot Token:** `YOUR_TELEGRAM_BOT_TOKEN`
- **Telegram Chat ID:** `YOUR_TELEGRAM_CHAT_ID`

---

# 8. Frontend-Only Test Strategy (Role-Based Scenarios)

**Overview:** The frontend application serves two distinct user groups. Testing must be separated into **Customer Flow** (Public/Restricted) and **Admin Flow** (Privileged).

#### **Test Suite 1: Customer Journey (User General)**
> **Actor:** Unauthenticated User / Registered Customer
> **Goal:** Search, Select, Book, and Pay.

1.  **Public View (Unauthenticated):**
    * **TC-01:** Open Homepage -> Verify List of Rooms (Mock Data) is displayed.
    * **TC-02:** Click Room -> Verify Room Detail & Gallery rendering.
    * **TC-03:** View Calendar -> Verify Green/Red status indicators render correctly.

2.  **Booking Logic (Mocked):**
    * **TC-04:** Select Overlapping Date -> Verify **"Room Unavailable"** popup/alert appears.
    * **TC-05:** Select Valid Date -> Click "Book" -> Verify redirect to **Login/Register** (if not logged in) or **Booking Summary** (if logged in).
    * **TC-06:** Submit Booking -> Verify **"Upload Payment Slip"** modal appears.
    * **TC-07:** After Upload -> Verify success message & redirect to "My Bookings".

#### **Test Suite 2: Admin Management (User Admin)**
> **Actor:** Administrator (`username: admin`)
> **Goal:** Manage System & Validate Bookings.

1.  **Authentication:**
    * **TC-08:** Enter `admin` / `password` -> Verify redirect to **Admin Dashboard**.
    * **TC-09:** Verify "Add Room" button appears **ONLY** when logged in as Admin.

2.  **Room Management (CRUD):**
    * **TC-10:** Click "Add Room" -> Fill form (Price, Type, Image) -> Submit -> Verify new room appears in list.
    * **TC-11:** Click "Edit Room" -> Change Price -> Save -> Verify update.
    * **TC-12:** Click "Delete Room" -> Verify confirmation popup -> Verify room removal.

3.  **Booking & Slip Verification:**
    * **TC-13:** Access "All Bookings" page -> Verify list of all customer bookings.
    * **TC-14:** Click a Booking ID -> Verify **Payment Slip Image** is displayed.
    * **TC-15:** Change Booking Status (e.g., Pending -> Confirmed) -> Verify status update UI.

4.  **Configuration:**
    * **TC-16:** Access "Settings" -> Verify QR Code Upload input exists.
    * **TC-17:** Access "Database Config" -> Verify input fields for Host/User/Pass exist.

#### **Test Suite 3: Security & Routing (Guardrails)**
> **Goal:** Ensure Customers cannot access Admin pages.

* **TC-18:** (As Customer) Try to access `/admin/dashboard` URL directly -> Verify redirect to **Home** or **403 Forbidden**.
* **TC-19:** (As Admin) Log out -> Try to click "Add Room" -> Verify button is hidden/disabled.

#### **Test Suite 4: Data Validation & Logic (Validation Logic)**
* **TC-20:** **Date Validation:** Test selecting a Check-out date that is earlier than or equal to the Check-in date; the system must block the booking.
* **TC-21:** **Room Deletion Constraint:** Attempt to delete a room with an "Active Booking"; the system must deny the deletion unless forced clear is used.

#### **Test Suite 5: Display & Data Integrity**
* **TC-22:** **Date Formatting:** Inspect all screens (including booking history and receipts) to ensure dates are in `dd-MM-yyyy` format and no raw `T00:00:00.000Z` strings are visible.
* **TC-23:** **Receipt Accuracy:** Verify the receipt displays the "Outstanding Balance" and correct Hotel Name/Address as configured.

#### **Test Suite 6: External Integrations**
* **TC-24:** **Google Calendar Sync:** Verify that upon booking confirmation, an event is created in the calendar with the customer's name and phone number in the description.
* **TC-25:** **Notification Content (LINE/Telegram):** Verify that messages sent to LINE and Telegram contain both **Booking Details** and the **Slip Image** (not just text).

#### **Test Suite 7: UX & Localization**
* **TC-26:** **Language Consistency:** Test toggling between TH/EN and verify that all UI elements (e.g., room status in Admin, error messages) update to the correct language without leftovers.
* **TC-27:** **Multiple Image Upload:** Test uploading more than one image for a room and verify the Gallery UI displays them correctly without layout breakage.