# ✨ GlowSync — Modern Salon Booking & Management Platform

An enterprise-grade, multi-tenant digital appointment scheduling and business management ecosystem tailored for luxury salons, independent barbershops, and spa wellness centers.

Built with a high-performance **FastAPI (Python)** backend and an ultra-responsive **React + Vite** frontend with custom CSS3 glassmorphism and modern typography.

---

## 📑 Deliverables Quick Index

| Deliverable | URL / Resource | Description |
| :--- | :--- | :--- |
| **1. Source Code Repository** | [GitHub Repository](https://github.com/muthu-krishnan-dca/SalonBookingPlatform.git) | Complete codebase with clean Git history |
| **2. Live Web Application** | `http://localhost:5173/` | Full customer booking & management platform |
| **3. Live Marketing Website** | `http://localhost:5173/` | Public landing page showcasing features & CTA |
| **4. Mobile Application / Build** | `http://localhost:5173/mobile` | Interactive Mobile App Simulator (iPhone 16 Pro & Android Pixel 9 Pro) |
| **5. Admin Dashboard** | `http://localhost:5173/admin` | Platform Super-Admin & Salon Owner Management Portals |
| **6. API Documentation** | `http://localhost:8000/docs` & `/redoc` | Interactive Swagger UI and ReDoc OpenAPI documentation |
| **7. README & Setup Guide** | `README.md` (This file) | Architecture, technical decisions & step-by-step setup |
| **8. Demo Credentials** | *Provided via submission notes* | Verified accounts for Admin, Owner, and Customer roles |

---

## 🏗️ System Architecture

```
                                 ┌─────────────────────────────────────────┐
                                 │     Client Layer (React 18 + Vite)      │
                                 ├────────────────────┬────────────────────┤
                                 │  Marketing Website │  Mobile Simulator  │
                                 │  Customer Portal   │  Owner & Admin UI  │
                                 └─────────┬──────────────────┬────────────┘
                                           │                  │
                                     HTTP REST / JSON   JWT Bearer Auth
                                           │                  │
                                 ┌─────────▼──────────────────▼────────────┐
                                 │        FastAPI Application Server       │
                                 ├─────────────────────────────────────────┤
                                 │  • SlowAPI Rate Limiting (Brute-force)  │
                                 │  • XSS Input Sanitization Engine        │
                                 │  • Multi-Stylist Slot Conflict Engine   │
                                 │  • BCrypt Password Security (12 rounds) │
                                 └─────────────────┬───────────────────────┘
                                                   │
                                      SQLAlchemy ORM Connection
                                                   │
                                 ┌─────────────────▼───────────────────────┐
                                 │      Database Engine (MySQL / SQLite)   │
                                 │  • Users & RBAC Roles                   │
                                 │  • Salons, Services & Staff Schedules   │
                                 │  • Real-Time Bookings & Reviews         │
                                 └─────────────────────────────────────────┘
```

---

## 🧠 Key Technical Decisions

### 1. Multi-Stylist Same-Slot Booking & Concurrency Guard
* **The Problem:** In traditional single-chair systems, once a 9:30 AM slot is booked, the entire salon is locked. In real-world salons, multiple stylists work simultaneously.
* **The Solution:** We engineered a granular 3-tier conflict engine:
  1. **Customer Self Conflict:** A single customer cannot accidentally book two appointments on the same date and time.
  2. **Stylist Concurrency:** Multiple customers **can book the exact same time slot** in the same salon, provided they choose **different stylists**.
  3. **Strict Duplicate Prevention:** If a customer attempts to book a stylist who already has an appointment, the system immediately returns `HTTP 409 Conflict`:
     `Already another booked. Stylist {name} is already booked on {date} at {time}. Please select another stylist or time slot.`
  4. **Smart Auto-Assignment:** Selecting *"Any Available Stylist"* automatically finds and assigns a non-busy stylist. Only if **all stylists** in the salon are booked is the slot blocked.

### 2. SlowAPI Rate Limiting & DoS Shielding
* Applied tiered SlowAPI rate limiting to safeguard sensitive endpoints:
  * **Authentication (`/login`, `/register`):** `5 requests/minute` to eliminate brute-force password spraying.
  * **Appointments (`POST /bookings/`):** `10 requests/minute` to prevent slot hoarding/scalping.
  * **General Discovery (`/salons`, `/services`):** `100 requests/minute`.
* Returns standard `HTTP 429 Too Many Requests` with automatic retry countdowns.

### 3. Deep Input Sanitization & XSS Defense
* Implemented a dedicated Pydantic v2 `SanitizedBaseModel` backed by regex and string-sanitization rules.
* Automatically strips `<script>`, `<iframe>`, `onload=`, `javascript:`, while preserving valid text ampersands (`&`) so treatments like *"Precision Haircut & Style"* render cleanly without HTML entity corruption (`&amp;`).

### 4. Role-Based Access Control (RBAC) & JWT Security
* Enforces role separation (`CUSTOMER`, `SALON_OWNER`, `ADMIN`) across both FastAPI dependency injection (`get_current_user`, `require_role`) and React route guards (`<ProtectedRoute allowedRoles={[...]} />`).
* Passwords hashed with BCrypt using an industry-standard work factor of 12 rounds.

### 5. Dual-Engine Database Fallback
* Configured with MySQL (`salon_booking`) as primary enterprise storage with automated fallback to SQLite if MySQL is offline, ensuring zero downtime during local testing.

---

## 🚀 Step-by-Step Setup & Running Guide

### Prerequisites
* **Python**: 3.10 or higher
* **Node.js**: 18 or higher (with npm)
* **MySQL** (Optional — SQLite fallback is enabled automatically)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/muthu-krishnan-dca/SalonBookingPlatform.git
cd SalonBookingPlatform
```

---

### Step 2: Backend Setup
```bash
cd backend

# 1. Create and activate a Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables (or use defaults in .env)
# .env file template:
# DATABASE_URL=mysql+pymysql://root:password@localhost:3306/salon_booking
# JWT_SECRET_KEY=glowsync-super-secure-production-cryptographic-signing-key-2026
# ACCESS_TOKEN_EXPIRE_MINUTES=720

# 4. Start the FastAPI development server
uvicorn main:app --reload --port 8000
```
* Backend will be live at: `http://localhost:8000`
* Interactive API Documentation (Swagger): `http://localhost:8000/docs`

---

### Step 3: Frontend Setup
```bash
cd ../frontend

# 1. Install Node dependencies
npm install

# 2. Start the Vite development server
npm run dev
```
* Frontend will be live at: `http://localhost:5173`

---

## 📱 Mobile Application (Simulator)

Navigate to `http://localhost:5173/mobile` to test the full mobile application flow:
* **Interactive Device Shell:** Toggle between **iPhone 16 Pro** and **Android Pixel 9 Pro**.
* **Complete Flow:**
  1. 1-Click Customer Login
  2. Nearby Salon Discovery
  3. Treatment & Package Selection
  4. Stylist Selection with experience badges
  5. Real-time Date & Time Slot Lock (disabled for already booked slots)
  6. Booking Review & Confirmation
  7. Active Appointments Management (with instant cancel option)

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user & return JWT Bearer Token |
| `POST` | `/auth/register` | Register new Customer or Salon Owner |
| `GET` | `/salons/` | List all verified salons with rating & operating hours |
| `GET` | `/services/salon/{id}` | Get treatments and pricing for a salon |
| `GET` | `/staff/salon/{id}` | Get stylists, specialties, and experience |
| `GET` | `/bookings/booked-slots` | **Real-time slots booked** for a given date/stylist |
| `POST` | `/bookings/` | **Create appointment** with double-booking prevention |
| `GET` | `/bookings/customer/{id}`| List appointments for a customer |
| `GET` | `/bookings/owner/{id}` | List appointments for a salon owner |
| `PATCH`| `/bookings/{id}/status` | Accept, confirm, complete, or reject booking |
| `GET` | `/reviews/salon/{id}` | Verified customer reviews and ratings |

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, React Router 6, Vanilla CSS3 (Custom Glassmorphism, Responsive Grid/Flexbox), Outfit Google Font.
* **Backend:** FastAPI, Python 3.11+, Pydantic v2, SlowAPI, SQLAlchemy, PyMySQL, BCrypt, Python-Jose (JWT).
* **Database:** MySQL 8.0 / SQLite3 fallback.

---

## 📄 License & Ownership
Developed for the Salon Booking Platform project. All rights reserved.
