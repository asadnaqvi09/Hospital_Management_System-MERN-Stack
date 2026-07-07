# 🏥 CareCore HMS — Server/Backend Ki Mukammal Report (Roman Urdu)

> 📘 **CareCore HMS** — Production-ready hospital backend documentation
> 🇵🇰 Roman Urdu mein likhi gayi mukammal technical guide for new developers

| 📦 Package | 🔌 Port | 🌐 API Prefix |
| --- | --- | --- |
| `carecore-hms-server` | `5000` | `/api/v1` |

---

## 📑 Table of Contents

- 🚀 [1. Shuruat — Yeh Project Kya Hai?](#1-shuruat-yeh-project-kya-hai)
- 📁 [2. Project Ki Folder Structure — Samajhna Zaroori Hai](#2-project-ki-folder-structure-samajhna-zaroori-hai)
- 🛠️ [3. Tech Stack — Kya Kya Use Hua Hai?](#3-tech-stack-kya-kya-use-hua-hai)
- ⚡ [4. Server Kaise Start Hota Hai? — Boot Process](#4-server-kaise-start-hota-hai-boot-process)
- 🗺️ [5. API Routing — Saari Modules Ek Jagah](#5-api-routing-saari-modules-ek-jagah)
- 👥 [6. User Roles — Kaun Kya Kar Sakta Hai?](#6-user-roles-kaun-kya-kar-sakta-hai)
- 🔐 [7. Authentication System — Module 1: Auth](#7-authentication-system-module-1-auth)
- 👤 [8. Users Module — Module 2: Staff Management](#8-users-module-module-2-staff-management)
- 🏥 [9. Patients Module — Module 3: Mareez Ka Record](#9-patients-module-module-3-mareez-ka-record)
- 🩺 [10. Doctors Module — Module 4: Doctor Profiles](#10-doctors-module-module-4-doctor-profiles)
- 📅 [11. Appointments Module — Module 5: Appointment Booking](#11-appointments-module-module-5-appointment-booking)
- 📋 [12. Consultations Module — Module 6: Doctor Ki Clinical Notes](#12-consultations-module-module-6-doctor-ki-clinical-notes)
- 💊 [13. Pharmacy Module — Module 7: Dawa aur Prescription](#13-pharmacy-module-module-7-dawa-aur-prescription)
- 🧪 [14. Lab Module — Module 8: Laboratory Tests](#14-lab-module-module-8-laboratory-tests)
- 🛏️ [15. IPD Module — Module 9: Indoor Patient (Ward)](#15-ipd-module-module-9-indoor-patient-ward)
- 💰 [16. Billing Module — Module 10: Invoice aur Payment](#16-billing-module-module-10-invoice-aur-payment)
- 🔔 [17. Notifications Module — Module 11: In-App Alerts](#17-notifications-module-module-11-in-app-alerts)
- 🤖 [18. AI Module — Module 12: Artificial Intelligence Features](#18-ai-module-module-12-artificial-intelligence-features)
- 📊 [19. Reports Module — Module 13: Admin Analytics](#19-reports-module-module-13-admin-analytics)
- 📝 [20. Audit Module — Module 14: Security Compliance](#20-audit-module-module-14-security-compliance)
- 🔍 [21. Search Module — Module 15: Global Patient Search](#21-search-module-module-15-global-patient-search)
- 🧩 [22. Shared Infrastructure — Common Code](#22-shared-infrastructure-common-code)
- ⏰ [23. Background Jobs — BullMQ Workers](#23-background-jobs-bullmq-workers)
- 📡 [24. Socket.io — Real-Time Events](#24-socket-io-real-time-events)
- 🗄️ [25. Database Migrations — Schema Evolution](#25-database-migrations-schema-evolution)
- 📦 [26. API Response Format — Uniform Structure](#26-api-response-format-uniform-structure)
- 🧭 [27. Poora Patient Journey — Ek Kahani](#27-poora-patient-journey-ek-kahani)
- ⚙️ [28. Environment Variables — Configuration](#28-environment-variables-configuration)
- 🛡️ [29. Security Summary — System Kaise Secure Hai](#29-security-summary-system-kaise-secure-hai)
- 📌 [30. Khulasa — Kya Kya Banaya Hai](#30-khulasa-kya-kya-banaya-hai)
- 💡 [31. Naye Developer Ke Liye Tips](#31-naye-developer-ke-liye-tips)
- ✅ [32. Aakhri Baat](#32-aakhri-baat)

---

## 🚀 1. Shuruat — Yeh Project Kya Hai?

Aap ne CareCore HMS (Hospital Management System) ka backend banaya hai. Yeh ek poora hospital ka digital system hai jo ek hi server se chalta hai. Is mein patient registration se le kar doctor consultation, pharmacy, lab tests, ward admission (IPD), billing, AI features, reports, aur security audit — sab kuch cover hota hai.

Yeh backend Node.js + Express.js par bana hai. Database ke liye PostgreSQL use hota hai (Supabase par host ho sakta hai). Raw SQL queries likhi gayi hain — koi ORM (jaise Prisma ya Sequelize) use nahi hua. Yeh aap ki tech stack ki requirement thi aur is se queries fast aur transparent rehti hain.

Server ka naam codebase mein "carecore-hms-server" hai. Default port 5000 hai. Saari APIs /api/v1 prefix ke neeche available hain.

Agar koi naya developer is project par aaye aur poochhe "Yeh kya banaya gaya hai?" — to seedha jawab yeh hai:

> 💡 **Seedha Jawab:** Ek production-ready hospital backend jisme **15 modules** hain, **7 user roles** hain, real-time notifications hain, background jobs hain, file storage hai, AI integration hai, aur poora clinical + administrative workflow digital hai.

---

## 📁 2. Project Ki Folder Structure — Samajhna Zaroori Hai

Server folder ka structure feature-based modules par based hai. Har module apna kaam karta hai:

```text
server/
├── src/
│   ├── app.js              → Express app setup
│   ├── server.js           → Server start, DB, Redis, sockets, jobs
│   ├── routes.js           → Saari modules ko ek jagah jodta hai
│   ├── modules/            → 15 business modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── patients/
│   │   ├── doctors/
│   │   ├── appointments/
│   │   ├── consultations/
│   │   ├── pharmacy/       → prescriptions + medicines
│   │   ├── lab/
│   │   ├── ipd/
│   │   ├── billing/
│   │   ├── notifications/
│   │   ├── ai/
│   │   ├── reports/
│   │   ├── audit/
│   │   └── search/
│   ├── shared/             → Common code (config, middleware, jobs, sockets, utils)
│   └── db/
│       ├── migrations/     → SQL schema files (001 se 018 tak)
│       ├── migrate.js      → Migrations run karta hai
│       └── seed.js         → Initial admin user seed karta hai
├── package.json
├── .env.example
└── Dockerfile
```

- Har module ke andar usually yeh files hoti hain:

| File | Kaam |
| --- | --- |
| *.route.js | API endpoints define karta hai |
| *.controller.js | Request handle karta hai, response bhejta hai |
| *.model.js | Database queries (raw SQL) |
| *.validator.js | Input validation (Zod schemas) |
| *.service.js | Complex business logic (kuch modules mein) |

---

## 🛠️ 3. Tech Stack — Kya Kya Use Hua Hai?

### 📌 3.1 Core Backend

| Technology | Istemal |
| --- | --- |
| Node.js | JavaScript runtime |
| Express 5 | HTTP server aur routing |
| PostgreSQL (pg) | Main database — raw SQL |
| Zod | Request body/query validation |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT access + refresh tokens |
| Speakeasy + QRCode | 2FA (TOTP) |

### 📌 3.2 Cache aur Background Jobs

| Technology | Istemal |
| --- | --- |
| Redis (ioredis) | Cache, rate limiting, OTP storage, login lockout |
| BullMQ | Background job queues (email, PDF, SMS, AI, alerts) |
| node-cron | Scheduled tasks (reminders, reports refresh) |

### 📌 3.3 Real-Time Communication

| Technology | Istemal |
| --- | --- |
| Socket.io | Live notifications, queue updates, AI completion events |
| @socket.io/redis-adapter | Multiple server instances ke liye socket scaling |

### 📌 3.4 File Storage aur Documents

| Technology | Istemal |
| --- | --- |
| Cloudflare R2 | Patient documents, lab PDFs, invoice PDFs |
| @aws-sdk/client-s3 | R2 compatible S3 API |
| Multer | File upload handling |
| PDFKit | PDF generation (lab reports, invoices, admin reports) |
| Sharp | Image processing (agar zaroorat ho) |

### 📌 3.5 External Services

| Technology | Istemal |
| --- | --- |
| Nodemailer | Email (password reset, appointment reminders) |
| Twilio | SMS (critical lab results, reminders) |
| Google Gemini / OpenAI | AI features (symptom check, drug interactions, summaries) |

### 📌 3.6 Security

| Technology | Istemal |
| --- | --- |
| Helmet | HTTP security headers |
| CORS | Cross-origin requests allow |
| express-rate-limit | API abuse se bachao |
| rate-limit-redis | Distributed rate limiting |
| Winston | Structured logging |
| Morgan | HTTP request logging |

---

## ⚡ 4. Server Kaise Start Hota Hai? — Boot Process

Jab aap npm start ya npm run dev chalate ho, yeh sequence hota hai:

#### Step 1: server.js Run Hota Hai

```javascript
// server.js ka flow:
1. createApp() → Express app banata hai
2. http.createServer(app) → HTTP server
3. initSocketServer(server) → Socket.io attach
4. server.listen(PORT) → Port 5000 par sunna shuru
5. checkDatabaseConnection() → PostgreSQL check
6. connectRedis() → Redis connect
7. startBackgroundWorkers() → BullMQ workers start
8. startSchedulers() → Cron jobs start
9. SIGINT/SIGTERM par graceful shutdown
```

#### Step 2: app.js Express Configure Karta Hai

Express app mein yeh middleware lagte hain:

- `trust proxy` — reverse proxy ke peeche sahi IP
- `helmet()` — security headers
- `cors()` — frontend se requests allow
- `express.json()` — JSON body parse
- `express.urlencoded()` — form data parse
- `cookieParser()` — cookies read
- `morgan("dev")` — request logs
- `GET /health` — health check endpoint
- `/api/v1` — saari APIs + rate limiter
- `notFound` — 404 handler
- `errorHandler` — global error handler
#### Step 3: Health Check

`GET /health` endpoint database se connect karke batata hai:

- Server up hai ya nahi
- Database connected hai ya nahi
- Database server time
- Uptime kitna hua
- Agar database down ho to 503 status milta hai — lekin server khud chal raha hota hai.

---

## 🗺️ 5. API Routing — Saari Modules Ek Jagah

routes.js file mein 15 modules register hain:

| Route Prefix | Module | Kaam |
| --- | --- | --- |
| `/api/v1/auth` | 🔐 Auth | Login, logout, 2FA, password reset |
| `/api/v1/users` | 👤 Users | Staff account management |
| `/api/v1/patients` | 🏥 Patients | Patient records, EMR, vitals, documents |
| `/api/v1/doctors` | 🩺 Doctors | Doctor profiles, schedule, availability |
| `/api/v1/appointments` | 📅 Appointments | Booking, queue, status |
| `/api/v1/consultations` | 📋 Consultations | Doctor consultation notes |
| `/api/v1/prescriptions` | 💊 Pharmacy | Prescriptions aur dispensing |
| `/api/v1/medicines` | 💊 Pharmacy | Medicine inventory |
| `/api/v1/lab` | 🧪 Lab | Lab tests aur results |
| `/api/v1/ipd` | 🛏️ IPD | Ward rooms aur admissions |
| `/api/v1/billing` | 💰 Billing | Invoices aur payments |
| `/api/v1/notifications` | 🔔 Notifications | In-app notifications |
| `/api/v1/ai` | 🤖 AI | Symptom check, summaries, predictions |
| `/api/v1/reports` | 📊 Reports | Admin analytics reports |
| `/api/v1/audit` | 📝 Audit | Security/compliance logs |
| `/api/v1/search` | 🔍 Search | Global patient search |

---

## 👥 6. User Roles — Kaun Kya Kar Sakta Hai?

System mein 7 roles hain:

| Role | Roman Urdu Mein Kaam |
| --- | --- |
| admin | Poora system control — users, doctors, reports, audit |
| doctor | Consultations, prescriptions, lab orders, IPD discharge |
| patient | Apni appointments, EMR, bills, symptom check |
| receptionist | Patient register, appointments, billing, admissions |
| pharmacist | Prescriptions dispense, medicine stock |
| lab_technician | Lab orders process, results enter |
| nurse | Vitals record, nursing notes, queue dekhna |

Har API endpoint par authenticate middleware JWT check karta hai, phir requireRole specific roles allow karta hai.

---

## 🔐 7. Authentication System — Module 1: Auth

### 📌 7.1 Auth Module Ka Maqsad

Yeh module system ki darwaza hai. Bina login ke koi protected API nahi chalegi. Is mein:

- Email + password login
- JWT access token (15 minute)
- Refresh token (7 din) — database mein hashed store
- 2FA (TOTP) admin/doctor ke liye
- Password forgot/reset (OTP via email)
- Session management (multiple devices)
- Login lockout (galat attempts par account lock)

### 📌 7.2 Auth Endpoints Detail

| Method | Path | Public/Protected | Kya Hota Hai |
| --- | --- | --- | --- |
| 🔵 `POST` | `/login` | Public | Email/password verify, token return ya 2FA challenge |
| 🔵 `POST` | `/2fa/verify` | Public | 2FA code verify karke tokens return |
| 🔵 `POST` | `/refresh` | Public | Access token renew (refresh token se) |
| 🔵 `POST` | `/logout` | Public | Refresh token revoke |
| 🔵 `POST` | `/forgot-password` | Public | Email par OTP bhejta hai |
| 🔵 `POST` | `/reset-password` | Public | OTP + naya password set |
| 🟢 `GET` | `/me` | Protected | Current user ki info |
| 🔵 `POST` | `/2fa/setup` | Protected | QR code generate (2FA enable karne se pehle) |
| 🔵 `POST` | `/2fa/enable` | Protected | TOTP verify karke 2FA on |
| 🟢 `GET` | `/sessions` | Protected | Active sessions list |
| 🔴 `DELETE` | `/sessions/:sessionId` | Protected | Kisi device ki session revoke |

### 📌 7.3 Login Flow Step by Step

- User email + password bhejta hai
- Server Redis mein check karta hai — account locked to nahi?
- Database se user fetch — password bcrypt se compare
- Agar galat password → attempt count badhta hai, 5 attempts par 15 min lock
- Agar sahi password + 2FA enabled → temporary 2FA token return (full access nahi)
- Agar sahi password + 2FA nahi → access + refresh tokens return
- Refresh token database mein hash karke save (user-agent, IP ke sath)
- Audit log: LOGIN action record

### 📌 7.4 Token System

- Access Token: Har API request mein Authorization: Bearer <token> header
- Refresh Token: Access expire hone par naya access token lene ke liye
- Token Rotation: Refresh use hone par purana revoke, naya issue

### 📌 7.5 Security Features

- Rate limiting auth endpoints par (20 requests / 15 min)
- OTP Redis mein expire hota hai (10 min default)
- Password bcrypt rounds: 12
- Admin/Doctor ko 2FA setup encourage kiya jata ha

---

## 👤 8. Users Module — Module 2: Staff Management

### 📌 8.1 Kaam

- Sirf admin staff accounts manage kar sakta hai — doctors, nurses, receptionists, pharmacists, lab technicians.

### 📌 8.2 Endpoints

| Method | Path | Role | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/` | Admin | Naya user account banaye |
| 🟢 `GET` | `/` | Admin | Saare users list (pagination) |
| 🟢 `GET` | `/:userId` | Admin | Ek user ki detail |
| 🟡 `PATCH` | `/:userId` | Admin | Name, email update |
| 🟡 `PATCH` | `/:userId/role` | Admin | Role change |
| 🟡 `PATCH` | `/:userId/deactivate` | Admin | Account band |
| 🟡 `PATCH` | `/:userId/activate` | Admin | Account dobara on |

### 📌 8.3 Business Rules

- Email unique honi chahiye
- Admin apna khud ka account deactivate nahi kar sakta
- Role change ya deactivate par saari refresh tokens revoke — forced logout
- Har mutation audit log mein jati hai

### 📌 8.4 Database Table

- `users` — id, email, password_hash, name, role, is_active, two_factor_enabled, two_factor_secret, created_at

---

## 🏥 9. Patients Module — Module 3: Mareez Ka Record

### 📌 9.1 Kaam

Yeh module hospital ka sab se important data rakhta hai — patient ki poori medical history.

### 📌 9.2 Endpoints

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/` | Receptionist, Admin | Naya patient register |
| 🟢 `GET` | `/` | Doctor, Receptionist, Admin, Nurse | Patients list |
| 🟢 `GET` | `/:patientId` | Multiple (patient apna) | Patient detail |
| 🟢 `GET` | `/:patientId/emr` | Doctor, Admin, Patient (own) | EMR Timeline — poori history |
| 🔵 `POST` | `/:patientId/vitals` | Doctor, Nurse | Blood pressure, pulse, etc. |
| 🟢 `GET` | `/:patientId/vitals` | Doctor, Nurse, Admin, Patient | Vitals history |
| 🔵 `POST` | `/:patientId/allergies` | Doctor | Allergy add |
| 🟢 `GET` | `/:patientId/allergies` | Multiple | Allergies list |
| 🔴 `DELETE` | `/:patientId/allergies/:allergyId` | Doctor | Allergy remove |
| 🔵 `POST` | `/:patientId/conditions` | Doctor | Chronic condition add |
| 🟢 `GET` | `/:patientId/conditions` | Multiple | Conditions list |
| 🟡 `PATCH` | `/:patientId/conditions/:conditionId` | Doctor | Condition update |
| 🔵 `POST` | `/:patientId/documents` | Doctor, Receptionist, Admin | File upload (R2) |
| 🟢 `GET` | `/:patientId/documents` | Multiple | Documents list |

### 📌 9.3 MRN Auto-Generation

Jab naya patient register hota hai, system automatically MRN (Medical Record Number) banata hai:

- Format: CC + zero-padded number
- Example: CC0001001, CC0001002
- PostgreSQL sequence patient_mrn_seq use hoti hai (1000 se start)

### 📌 9.4 EMR Timeline Kya Hai?

- GET /:patientId/emr ek combined view deta hai:

- Allergies
- Active conditions
- Recent vitals
- Appointments history
- Consultations
- Prescriptions
- Lab orders
- Doctor ek hi API call mein patient ki poori picture dekh sakta hai.

### 📌 9.5 Document Upload

- Multer se file receive hoti hai (max 10MB)
- Cloudflare R2 par upload: patients/{patientId}/documents/{filename}
- Database mein metadata save: file name, type, size, R2 key
- Signed URL se secure download

### 📌 9.6 Database Tables

- patients — demographics, CNIC, phone, blood group, emergency contact
- patient_vitals — BP, pulse, temperature, weight, height, SpO2
- patient_allergies — allergen, severity, reaction
- patient_conditions — condition name, ICD code, status (active/resolved)
- patient_documents — file metadata + R2 reference

### 📌 9.7 CNIC Uniqueness

Pakistan context mein CNIC unique check hoti hai — duplicate patient register nahi ho sakta same CNIC se.

---

## 🩺 10. Doctors Module — Module 4: Doctor Profiles

### 📌 10.1 Kaam

Doctor ki professional info, weekly schedule, leaves, aur availability manage karna.

### 📌 10.2 Endpoints

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/` | Admin | Naya doctor profile (user link) |
| 🟢 `GET` | `/` | Authenticated | Doctors list |
| 🟢 `GET` | `/:doctorId` | Authenticated | Doctor detail |
| 🟡 `PATCH` | `/:doctorId` | Admin, Doctor (own) | Profile update |
| 🟠 `PUT` | `/:doctorId/schedule` | Admin, Doctor (own) | Weekly schedule set |
| 🟢 `GET` | `/:doctorId/schedule` | Authenticated | Schedule dekhna |
| 🔵 `POST` | `/:doctorId/leaves` | Admin, Doctor (own) | Leave add |
| 🟢 `GET` | `/:doctorId/leaves` | Authenticated | Leaves list |
| 🔴 `DELETE` | `/:doctorId/leaves/:leaveId` | Admin, Doctor (own) | Leave cancel |
| 🟢 `GET` | `/:doctorId/availability?date=` | Patient, Receptionist, Admin, Doctor | Available slots |

### 📌 10.3 Schedule System

Doctor apna hafta war schedule set karta hai:

- Har din (Monday-Sunday) ke liye start time, end time, slot duration
- Example: Monday 9:00 AM - 5:00 PM, 30 min slots
- PUT /schedule purana schedule delete karke naya insert karta hai (transaction mein)

### 📌 10.4 Availability Calculation

Jab patient appointment book karna chahe:

```text
Available Slots = Schedule Slots - Booked Appointments - Leave Dates
generateTimeSlots() utility function time slots banata hai. isSlotAvailable() check karta hai ke slot free hai ya nahi.
```

### 📌 10.5 Database Tables

- doctors — specialization, qualification, consultation_fee, license_number
- doctor_schedules — day_of_week, start_time, end_time, slot_duration_minutes
- doctor_leaves — start_date, end_date, reaso

---

## 📅 11. Appointments Module — Module 5: Appointment Booking

### 📌 11.1 Kaam

Patient aur doctor ke beech meeting schedule karna — yeh hospital workflow ka entry point hai.

### 📌 11.2 Endpoints

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/` | Patient, Receptionist, Admin, Doctor | Naya appointment |
| 🟢 `GET` | `/` | Authenticated (auto-scoped) | Appointments list |
| 🟢 `GET` | `/queue?date=` | Receptionist, Doctor, Admin, Nurse | Aaj ki queue |
| 🟢 `GET` | `/:appointmentId` | Authenticated | Single appointment |
| 🟡 `PATCH` | `/:appointmentId/status` | Doctor, Receptionist, Admin | Status change |
| 🟡 `PATCH` | `/:appointmentId/reschedule` | Patient, Receptionist, Admin | Date/time change |
| 🟡 `PATCH` | `/:appointmentId/cancel` | Patient, Receptionist, Admin | Cancel |

### 📌 11.3 Appointment Status Flow

Yeh ek state machine hai — random status change allowed nahi:

```text
scheduled → confirmed → checked_in → in_consultation → completed
↓              ↓              ↓
cancelled      cancelled      cancelled
↓              ↓              ↓
no_show        no_show        no_show
```

| Status | Matlab |
| --- | --- |
| scheduled | Book ho gaya, confirm nahi hua |
| confirmed | Confirm ho gaya |
| checked_in | Patient hospital pahunch gaya |
| in_consultation | Doctor ke paas hai |
| completed | Consultation khatam |
| cancelled | Cancel ho gaya |
| no_show | Patient nahi aaya |

### 📌 11.4 Booking Rules

- Slot availability check — doctor ka slot free hona chahiye
- Double booking prevent — unique constraint: doctor + date + slot_time
- Walk-in/Emergency — slot check skip ho sakta hai
- Patient self-book — patient sirf apne liye book kar sakta hai
- Staff book — receptionist kisi bhi patient ke liye
- Cancellation policy — patient ko 2+ hours pehle cancel karna hoga

### 📌 11.5 Real-Time Queue Updates

Jab appointment book ya status change ho:

- Socket event appointment:booked → doctor ko notify
- Socket event queue:update → receptionist/nurse ko queue refresh

### 📌 11.6 Appointment Reminders

- Background cron job har 15 minute check karta hai:

- 24 hours pehle reminder (email/SMS)
- 2 hours pehle reminder
- Flags: reminder_24h_sent, reminder_2h_sent database mein

### 📌 11.7 Database Table

- `appointments` — patient_id, doctor_id, appointment_date, slot_time, status, type (regular/walk_in/emergency), notes, no_show_probability (AI se

---

## 📋 12. Consultations Module — Module 6: Doctor Ki Clinical Notes

### 📌 12.1 Kaam

Jab patient doctor ke paas baithta hai, doctor consultation record banata hai — yeh clinical encounter ka official document hai.

### 📌 12.2 Endpoints

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/` | Doctor | Naya consultation shuru |
| 🟢 `GET` | `/` | Doctor, Admin, Patient (scoped) | Consultations list |
| 🟢 `GET` | `/appointment/:appointmentId` | Doctor, Admin, Patient | Appointment se consultation |
| 🟢 `GET` | `/:consultationId` | Doctor, Admin, Patient | Detail |
| 🟡 `PATCH` | `/:consultationId` | Doctor (own) | Notes update |
| 🟡 `PATCH` | `/:consultationId/complete` | Doctor (own) | Consultation complete |

### 📌 12.3 Consultation Fields

| Field | Matlab |
| --- | --- |
| chief_complaint | Patient ki main shikayat |
| history_of_present_illness | Bimari ki history (HOPI) |
| physical_examination | Doctor ka examination |
| diagnosis_text | Free text diagnosis |
| management_plan | Ilaj ka plan |
| follow_up_date | Agli visit ki date |

### 📌 12.4 Structured Diagnoses (ICD Codes)

Consultation ke sath ICD-coded diagnoses bhi save hote hain:

- Type: primary, secondary, differential
- ICD code + description
- Update par purane diagnoses replace hote hain

### 📌 12.5 Business Rules

- Ek appointment = ek consultation (unique constraint)
- Sirf confirmed, checked_in, ya in_consultation appointment se consultation khul sakti hai
- 24 hours baad auto-lock — is_locked = true, edit nahi ho sakti
- Complete karne par appointment status → completed

### 📌 12.6 Database Tables

- consultations — clinical notes, lock status
- diagnoses — ICD codes per consultatio

---

## 💊 13. Pharmacy Module — Module 7: Dawa aur Prescription

Pharmacy module do hisson mein divided hai:

### 📌 13.1 Prescriptions (/api/v1/prescriptions)

Endpoints
| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/` | Doctor | Naya prescription likhe |
| 🟢 `GET` | `/pending` | Pharmacist, Admin | Pending prescriptions |
| 🔵 `POST` | `/:prescriptionId/dispense` | Pharmacist, Admin | Dawa dispense kare |
| 🟢 `GET` | `/` | Doctor, Pharmacist, Admin, Patient | List |
| 🟢 `GET` | `/:prescriptionId` | Multiple | Detail |

Prescription Create Flow
- Doctor consultation se prescription banata hai
- Har medicine item: name, dosage, frequency, duration, quantity
AI Drug Interaction Check automatically chalti hai:
- OpenFDA labels fetch
- Gemini AI analysis
- Warnings return hote hain
Prescription status: pending
Dispensing Flow (FIFO)
- Pharmacist pending prescription dekhta hai
- Dispense request mein quantity specify
- Transaction start:
- Medicine batches se stock deduct (FIFO — pehle expire hone wali pehle)
- medicine_dispensing record create
Prescription item ki dispensed_quantity update
- Agar poori quantity dispense → status dispensed
- Agar partial → status partially_dispensed
- Patient ko notification: prescription_dispensed

### 📌 13.2 Medicines (/api/v1/medicines)

Endpoints
| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🟢 `GET` | `/alerts/reorder` | Pharmacist, Admin | Low stock alert |
| 🟢 `GET` | `/alerts/expiry?days=` | Pharmacist, Admin | Expiry alert |
| 🔵 `POST` | `/` | Admin | Nayi medicine add |
| 🟢 `GET` | `/` | Pharmacist, Admin, Doctor | Medicines catalog |
| 🟢 `GET` | `/:medicineId` | Multiple | Detail |
| 🟡 `PATCH` | `/:medicineId` | Admin | Update |
| 🔵 `POST` | `/:medicineId/batches` | Pharmacist, Admin | Naya stock batch |

Inventory Management
- Medicine catalog: name, generic name, form, strength, reorder_level
- Batches: batch_number, quantity, expiry_date, purchase_price
- FIFO dispensing: oldest expiry batch pehle use
- Low stock alert: jab stock_quantity <= reorder_level
- Expiry alert: 30 din (configurable) ke andar expire hone wali
Daily Stock Check (Cron)
Har roz subah 2 baje:

- Low stock medicines check
- Expiring batches check
- Pharmacy staff ko notifications

### 📌 13.3 Database Tables

- prescriptions — consultation link, status, doctor, patient
- prescription_items — medicine, dosage, quantity, dispensed_quantity
- medicine_dispensing — dispense events log
- medicines — drug catalog
- medicine_batches — inventory batche

---

## 🧪 14. Lab Module — Module 8: Laboratory Tests

### 📌 14.1 Kaam

Doctor lab tests order karta hai, lab technician sample le kar results enter karta hai.

### 📌 14.2 Endpoints

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/tests` | Admin | Naya test catalog mein add |
| 🟢 `GET` | `/tests` | Doctor, Lab Tech, Admin | Tests list |
| 🟡 `PATCH` | `/tests/:testId` | Admin | Test update |
| 🔴 `DELETE` | `/tests/:testId` | Admin | Test deactivate (soft delete) |
| 🔵 `POST` | `/orders` | Doctor | Naya lab order |
| 🟢 `GET` | `/orders` | Doctor, Lab Tech, Admin, Patient | Orders list |
| 🟢 `GET` | `/orders/:orderId` | Multiple | Order detail |
| 🟡 `PATCH` | `/orders/:orderId/status` | Lab Technician | Order status change |
| 🟡 `PATCH` | `/orders/:orderId/items/:itemId/results` | Lab Technician | Results enter |

### 📌 14.3 Test Catalog

Har test mein:

- Name, code, category
Normal range (min-max)
Critical range
Price
Sample type (blood, urine, etc.)

### 📌 14.4 Lab Order Status Flow

```text
ordered → sample_collected → processing → completed
```

| Status | Matlab |
| --- | --- |
| ordered | Doctor ne order kiya |
| sample_collected | Sample le liya gaya |
| processing | Lab mein test ho raha hai |
| completed | Results ready |

### 📌 14.5 Results Entry

Lab technician har test item ke results enter karta hai:

- Numeric value → automatic abnormal/critical flag
- Text value → manual interpretation
- Reference range comparison

### 📌 14.6 Completion Actions

Jab saare items complete:

- PDF generate (background job) → R2 par upload
- Notification doctor + patient ko
- Agar critical result → SMS bhi (Twilio se)

### 📌 14.7 Database Tables

- lab_tests — test catalog
- lab_orders — order header (patient, doctor, consultation)
- lab_order_items — individual tests + result

---

## 🛏️ 15. IPD Module — Module 9: Indoor Patient (Ward)

### 📌 15.1 Kaam

Jo patient hospital mein admit rehta hai (Indoor/ICU/Ward) — unka management.

### 📌 15.2 Endpoints

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/rooms` | Admin | Naya room/bed add |
| 🟢 `GET` | `/rooms` | Doctor, Nurse, Receptionist, Admin | Rooms list |
| 🟡 `PATCH` | `/rooms/:roomId` | Admin | Room update |
| 🔵 `POST` | `/admissions` | Doctor, Receptionist | Patient admit |
| 🟢 `GET` | `/admissions` | Doctor, Nurse, Admin, Patient | Admissions list |
| 🟢 `GET` | `/admissions/:admissionId` | Multiple | Admission detail |
| 🔵 `POST` | `/admissions/:admissionId/notes` | Nurse | Nursing note add |
| 🟢 `GET` | `/admissions/:admissionId/notes` | Doctor, Nurse, Admin | Notes list |
| 🟡 `PATCH` | `/admissions/:admissionId/discharge` | Doctor | Patient discharge |

### 📌 15.3 Room Management

Har room mein:

- Room number, type (general, private, ICU)
- Total beds, daily rate
Status: available, occupied, maintenance
- Optimistic locking (version column) — do admissions ek sath same bed par nahi

### 📌 15.4 Admission Flow

- Doctor/Receptionist admission create karta hai
- Room select — available beds check
- Admission reason, admitting doctor
Status: admitted
Room occupied mark

### 📌 15.5 Nursing Notes

Nurse har shift mein notes likhta hai:

- Shift: morning, afternoon, night
- Vitals, observations, medications given
Doctor admission detail mein dekh sakta hai

### 📌 15.6 Discharge Flow

- Doctor discharge initiate karta hai
- Discharge summary, instructions
Status: discharged
Agar room mein aur koi admitted nahi → room available

### 📌 15.7 Business Rules

Ek patient = ek active admission — dobara admit tab jab pehli discharge ho
Room charges billing mein automatically include hote hain

### 📌 15.8 Database Tables

- rooms — ward rooms
- admissions — patient admissions
- nursing_notes — shift-wise note

---

## 💰 16. Billing Module — Module 10: Invoice aur Payment

### 📌 16.1 Kaam

Hospital ki paisa wali side — consultation fees, lab charges, medicines, room charges sab invoice mein.

### 📌 16.2 Endpoints

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/invoices/generate` | Receptionist, Admin | Auto-generate invoice |
| 🔵 `POST` | `/invoices` | Receptionist, Admin | Manual invoice |
| 🟢 `GET` | `/invoices` | Receptionist, Admin, Doctor, Patient | List |
| 🟢 `GET` | `/invoices/:invoiceId` | Multiple | Detail |
| 🟡 `PATCH` | `/invoices/:invoiceId` | Receptionist, Admin | Draft edit |
| 🔵 `POST` | `/invoices/:invoiceId/finalize` | Receptionist, Admin | Finalize |
| 🔵 `POST` | `/invoices/:invoiceId/cancel` | Receptionist, Admin | Cancel |
| 🔵 `POST` | `/invoices/:invoiceId/payments` | Receptionist, Admin | Payment record |

### 📌 16.3 Auto-Generate Invoice

- POST /invoices/generate ek patient ke liye automatically sab charges pull karta hai:

| Source | Kya Include |
| --- | --- |
| Consultations | Doctor consultation fee |
| Lab Orders | Completed lab tests ki price |
| Prescriptions | Dispensed medicines ki cost |
| IPD Admissions | Days × daily room rate |

### 📌 16.4 Invoice Status Flow

```text
draft → finalized → partially_paid → fully_paid
↓
cancelled
```

| Status | Matlab |
| --- | --- |
| draft | Abhi edit ho sakta hai |
| finalized | Lock ho gaya, payment accept |
| partially_paid | Kuch payment ho gaya |
| fully_paid | Poora payment |
| cancelled | Cancel |

### 📌 16.5 Payment Methods

- `cash`
- `card`
- `bank_transfer`
- `insurance` (insurance provider, policy number fields)

### 📌 16.6 Finalize Actions

Jab invoice finalize hota hai:

- Status → finalized
PDF receipt background mein generate → R2
- Patient ko notification: invoice_finalized
- Payment par notification: payment_received

### 📌 16.7 Database Tables

- invoices — header, total, status, insurance info
- invoice_items — line items (description, quantity, unit_price)
- payments — payment record

---

## 🔔 17. Notifications Module — Module 11: In-App Alerts

### 📌 17.1 Kaam

Har user ko apne account se related real-time notifications milte hain.

### 📌 17.2 Endpoints

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🟢 `GET` | `/unread-count` | Authenticated | Kitni unread hain |
| 🟡 `PATCH` | `/read-all` | Authenticated | Sab read mark |
| 🟢 `GET` | `/` | Authenticated | Notifications list |
| 🟡 `PATCH` | `/:notificationId/read` | Authenticated | Ek read mark |

### 📌 17.3 Notification Types

| Type | Kab Banta Hai |
| --- | --- |
| prescription_dispensed | Dawa mil gayi |
| invoice_finalized | Bill ready |
| payment_received | Payment confirm |
| invoice_pdf | Receipt PDF ready |
| lab_report | Lab report ready |
| lab_critical | Critical lab result |
| low_stock | Medicine kam hai |
| expiry_alert | Medicine expire hone wali |

### 📌 17.4 Real-Time Delivery

Jab notification create hota hai:

- Database mein insert
- Socket.io event notification:new → user ke room mein
- Frontend instantly show kar sakta hai

### 📌 17.5 Database Table

- notifications — user_id, type, title, message, is_read, metadata (JSON

---

## 🤖 18. AI Module — Module 12: Artificial Intelligence Features

### 📌 18.1 Kaam

Google Gemini (default) ya OpenAI use karke smart hospital features.

### 📌 18.2 Endpoints (Rate Limited: 30/15min)

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🔵 `POST` | `/symptom-check` | Patient | Symptom triage shuru |
| 🟢 `GET` | `/symptom-check` | Patient | Apne sessions |
| 🟢 `GET` | `/symptom-check/:sessionId` | Patient | Session result |
| 🔵 `POST` | `/history-summary` | Doctor, Admin, Nurse | Patient summary generate |
| 🟢 `GET` | `/history-summary/:patientId` | Multiple | Cached summary |
| 🔵 `POST` | `/drug-interactions` | Doctor, Pharmacist, Admin | Drug interaction check |
| 🔵 `POST` | `/no-show/predict` | Receptionist, Admin, Doctor | Batch prediction |
| 🔵 `POST` | `/no-show/:appointmentId` | Receptionist, Admin, Doctor | Single prediction |

### 📌 18.3 Symptom Check (Patient Self-Triage)

- Patient symptoms describe karta hai (text)
- Background AI job queue mein jata hai
- AI analyze karta hai:
- Suggested department (cardiology, ortho, etc.)
- Urgency level (low, medium, high, emergency)
- Recommendations
- Socket event ai:symptom-complete → patient ko result
- Session database mein save

### 📌 18.4 History Summary (Doctor Helper)

- Patient ki last 12 months ki data aggregate:
Consultations, diagnoses, prescriptions, lab results, vitals
- AI se concise summary generate
- Daily cache — ek din mein ek bar generate, phir cache se return

### 📌 18.5 Drug Interaction Check

- Multiple medicines ki list bhejo
- OpenFDA se drug labels fetch
AI interaction analysis
- Warnings + severity return
Prescription create par automatically bhi chalti hai

### 📌 18.6 No-Show Prediction

- Appointment data analyze (patient history, day, time, weather patterns)
- AI probability score: no_show_probability (0-1)
- Daily cron batch mein upcoming 14 days ke appointments score
- Receptionist high-risk appointments dekh sakta hai

### 📌 18.7 Database Tables

- ai_symptom_sessions — triage sessions
- ai_history_summaries — cached summarie

---

## 📊 19. Reports Module — Module 13: Admin Analytics

### 📌 19.1 Kaam

- Sirf admin ke liye hospital ki performance reports.

### 📌 19.2 Endpoints (Rate Limited: 60/15min)

| Method | Path | Action |
| --- | --- | --- |
| 🔵 `POST` | `/refresh` | Materialized views refresh |
| 🟢 `GET` | `/exports/:exportId` | Export status check |
| 🟢 `GET` | `/:reportType/export/csv` | CSV download |
| 🔵 `POST` | `/:reportType/export/pdf` | PDF export (async) |
| 🟢 `GET` | `/:reportType?fromDate=&toDate=` | Report data |

### 📌 19.3 Report Types

| Report | Kya Dikhata Hai |
| --- | --- |
| revenue | Rozana revenue, payment methods |
| patient-volume | Naye registrations, demographics |
| doctor-performance | Consultations per doctor, revenue |
| appointment-analytics | Booking trends, no-shows, cancellations |
| bed-occupancy | IPD room utilization |

### 📌 19.4 Materialized Views

Reports fast karne ke liye pre-computed views hain:

- mv_daily_revenue
- mv_patient_registrations
- mv_doctor_performance
- mv_appointment_analytics
- mv_bed_occupancy
- Nightly refresh: roz raat 1 baje cron job sab views refresh karta hai. Manual refresh bhi available: POST /refresh

### 📌 19.5 Export Options

- CSV: Direct stream download
- PDF: Background job → R2 upload → notification jab ready

### 📌 19.6 Database Tables

- Materialized views (upar wale)
- report_exports — async export job trackin

---

## 📝 20. Audit Module — Module 14: Security Compliance

### 📌 20.1 Kaam

Har important action ka record — security audits, compliance, debugging ke liye.

### 📌 20.2 Endpoints (Admin Only)

| Method | Path | Action |
| --- | --- | --- |
| 🟢 `GET` | `/` | Audit logs list (filters) |
| 🟢 `GET` | `/:auditId` | Single log detail |

### 📌 20.3 Audit Actions

| Action | Kab Log Hota Hai |
| --- | --- |
| CREATE | Naya record banaya |
| UPDATE | Record update |
| DELETE | Record delete |
| LOGIN | User login |
| LOGOUT | User logout |
| ACCESS | Sensitive data access |

### 📌 20.4 Log Contents

Har audit log mein:

- user_id, user_role
- action, entity_type, entity_id
- before_state (JSON) — pehle kya tha
- after_state (JSON) — baad mein kya hua
- ip_address, user_agent
created_at

### 📌 20.5 Filters

- Admin filter kar sakta hai:

User ID
Role
Action type
Entity type/ID
Date range

### 📌 20.6 Database Table

- audit_log

---

## 🔍 21. Search Module — Module 15: Global Patient Search

### 📌 21.1 Kaam

Reception ya koi staff jaldi patient dhundh sake — naam, MRN, CNIC, phone se.

### 📌 21.2 Endpoint

| Method | Path | Roles | Action |
| --- | --- | --- | --- |
| 🟢 `GET` | `/patients?q=` | Admin, Receptionist, Doctor, Nurse, Pharmacist, Lab Tech | Search |

### 📌 21.3 Search Logic

Query in fields mein search hoti hai:

Patient name
MRN
CNIC
Phone number
Linked user email
Relevance ordering:

- Exact MRN match (sab se upar)
CNIC match
Phone match
Name partial match

### 📌 21.4 Use Case

- Reception desk par patient aaye aur kahe "mera naam Ali hai" — receptionist type kare aur turant record mil jaye.

---

## 🧩 22. Shared Infrastructure — Common Code

### 📌 22.1 Config Files (shared/config/)

| File | Kaam |
| --- | --- |
| env.js | Saari environment variables ek jagah |
| db.js | PostgreSQL connection pool (max 10) |
| redis.js | Redis client |
| r2.js | Cloudflare R2 S3 client |
| ai.js | Gemini/OpenAI abstraction |

### 📌 22.2 Middlewares (shared/middlewares/)

| Middleware | Kaam |
| --- | --- |
| authenticate.js | JWT verify → req.user set |
| requireRole.js | Role check |
| validate.js | Zod schema validation → req.validated |
| rateLimit.js | API abuse prevention |
| audit.js | writeAuditLog() helper |
| upload.js | Multer file upload |
| errorHandler.js | Global error catch |
| notFound.js | 404 response |

### 📌 22.3 Rate Limits

| Limiter | Limit | Scope |
| --- | --- | --- |
| authLimiter | 20 / 15 min | Login, password reset |
| apiLimiter | 300 / 15 min | Saari APIs |
| aiLimiter | 30 / 15 min | AI endpoints |
| reportsLimiter | 60 / 15 min | Reports endpoints |

### 📌 22.4 Utils (shared/utils/)

| Utility | Kaam |
| --- | --- |
| apiResponse.js | Uniform { success, data, message } format |
| AppError.js | Structured errors with code |
| asyncHandler.js | Async route wrapper |
| hash.js | bcrypt, token hashing, OTP |
| mailer.js | Email send |
| sms.js | Twilio SMS |
| storage.js | R2 upload/download/delete |
| notifications.js | DB insert + socket emit |
| time.js | Slot generation helpers |
| logger.js | Winston logger |

---

## ⏰ 23. Background Jobs — BullMQ Workers

### 📌 23.1 Queues

| Queue | Worker File | Kaam |
| --- | --- | --- |
| email | email.job.js | Emails bhejna |
| pdf | pdf.job.js | PDFs generate karna |
| sms | sms.job.js | SMS bhejna |
| alerts | alerts.job.js | Stock/expiry alerts |
| ai | ai.job.js | AI processing |

### 📌 23.2 Job Types Detail

| Queue | Job Name | Trigger | Action |
| --- | --- | --- | --- |
| email | appointment-reminder | Cron */15 min | 24h/2h reminders |
| sms | appointment-reminder | Cron */15 min | SMS reminders |
| sms | critical-lab | Lab complete | Critical result SMS |
| pdf | lab-report | Lab complete | Lab PDF → R2 |
| pdf | invoice-receipt | Invoice finalize | Receipt PDF → R2 |
| pdf | report-export | Admin request | Report PDF → R2 |
| alerts | stock-expiry-check | Cron daily 2 AM | Pharmacy alerts |
| ai | symptom-triage | Patient request | AI analysis |
| ai | no-show-batch | Cron daily 3 AM | Batch predictions |

### 📌 23.3 Schedulers (Cron Jobs)

| Schedule | Task |
| --- | --- |
| */15 * * * * | Appointment reminders check |
| 0 1 * * * | Report materialized views refresh |
| 0 2 * * * | Stock/expiry alerts |
| 0 3 * * * | No-show predictions (14 days ahead) |

---

## 📡 24. Socket.io — Real-Time Events

### 📌 24.1 Connection

Client connect karte waqt JWT token bhejta hai:

```javascript
socket.auth = { token: accessToken }
```

### 📌 24.2 Rooms

Connect hone par user automatically join hota hai:

- `user:{userId}` — personal notifications
- `role:{role}` — role-based broadcasts

### 📌 24.3 Events

| Event | Direction | Recipients | Kab |
| --- | --- | --- | --- |
| notification:new | Server → Client | Specific user | Koi notification create |
| queue:update | Server → Client | Receptionist, Nurse | Appointment status change |
| appointment:booked | Server → Client | Doctor | Naya appointment |
| ai:symptom-complete | Server → Client | Patient | AI triage complete |

---

## 🗄️ 25. Database Migrations — Schema Evolution

18 migration files hain (001 se 018):

| Migration | Tables Created |
| --- | --- |
| 001_extensions | PostgreSQL extensions (uuid, etc.) |
| 002_users | users, refresh_tokens |
| 003_doctors | doctors, doctor_schedules, doctor_leaves |
| 004_patients | patients, vitals, allergies, conditions |
| 005_appointments | appointments |
| 006_consultations | consultations, diagnoses |
| 007_ipd | rooms, admissions, nursing_notes |
| 008_pharmacy | prescriptions, items, medicines, batches |
| 009_lab | lab_tests, lab_orders, lab_order_items |
| 010_billing | invoices, invoice_items, payments |
| 011_notifications | notifications |
| 012_audit | audit_logs |
| 013_ai | ai_symptom_sessions, ai_history_summaries |
| 014_patient_documents | patient_documents |
| 015_phase3_clinical | Clinical enhancements |
| 016_phase4_pharmacy_billing | Pharmacy/billing updates |
| 017_phase5_ai | AI feature tables |
| 018_phase6_reports | Materialized views, report_exports |

- Run karne ke liye: npm run migrate

---

## 📦 26. API Response Format — Uniform Structure

Har API response is format mein:

**Success:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [ ... ]
  }
}
```

---

## 🧭 27. Poora Patient Journey — Ek Kahani

Samjho ek patient Ahmed hospital mein aata hai:

#### Step 1: Registration

- Receptionist `POST /patients` se register karta hai
- MRN generate: `CC0001050`
- Audit log: `CREATE` patient

#### Step 2: Appointment Book

- Ahmed ya receptionist `POST /appointments` se book karta hai
- Doctor ki availability check hoti hai
- Socket: doctor ko `appointment:booked`
- 24h aur 2h reminders schedule

#### Step 3: Hospital Aana

- Receptionist queue mein dekhta hai: `GET /appointments/queue`
- Status change: `checked_in`
- Socket: `queue:update` sab receptionists ko

#### Step 4: Doctor Consultation

- Doctor `POST /consultations` se consultation shuru
- Status: `in_consultation`
- Vitals nurse ne pehle record kiye: `POST /patients/:id/vitals`
- Doctor notes likhta hai, diagnoses add karta hai
- `PATCH /consultations/:id/complete` → appointment `completed`

#### Step 5: Prescription

- Doctor `POST /prescriptions` se dawa likhta hai
- AI drug interaction check automatic
- Pharmacist `GET /prescriptions/pending` se dekhta hai
- `POST /prescriptions/:id/dispense` → stock deduct, patient notify

#### Step 6: Lab Tests

- Doctor `POST /lab/orders` se tests order
- Lab tech sample le kar status update
- Results enter → PDF generate → patient notify
- Agar critical → SMS bhi

#### Step 7: IPD (Agar Admit Ho)

- Doctor `POST /ipd/admissions` se admit
- Room assign, bed occupied
- Nurse shift notes likhta hai
- Discharge par room free

#### Step 8: Billing

- Receptionist `POST /billing/invoices/generate`
- Auto-pull: consultation + lab + pharmacy + room charges
- `POST /invoices/:id/finalize` → PDF receipt
- `POST /invoices/:id/payments` → payment record
- Patient notify: bill ready, payment received

#### Step 9: Patient Portal

- Ahmed login karke apna EMR dekhta hai: `GET /patients/:id/emr`
- Appointments, prescriptions, lab reports, bills — sab ek jagah

---

## ⚙️ 28. Environment Variables — Configuration

- .env.example se saari settings:

| Variable | Purpose |
| --- | --- |
| NODE_ENV | development/production |
| PORT | Server port (5000) |
| DATABASE_URL | PostgreSQL connection |
| REDIS_URL | Redis connection |
| JWT_* | Token secrets aur expiry |
| SMTP_* | Email settings |
| R2_* | Cloudflare R2 storage |
| TWILIO_* | SMS settings |
| GEMINI_API_KEY | AI provider |
| MAX_LOGIN_ATTEMPTS | Security (5) |
| MEDICINE_EXPIRY_ALERT_DAYS | Pharmacy alerts (30) |

---

## 🛡️ 29. Security Summary — System Kaise Secure Hai

- JWT Authentication — har request verified
- Role-Based Access Control — har endpoint specific roles
- 2FA for Admin/Doctor — TOTP extra layer
- Password Hashing — bcrypt 12 rounds
- Login Lockout — brute force protection
- Rate Limiting — API abuse prevention
- Helmet — HTTP security headers
- Audit Logging — har action tracked
- Input Validation — Zod schemas
- SQL Injection Prevention — parameterized queries
- File Upload Limits — 10MB max
- Signed URLs — secure file access

---

## 📌 30. Khulasa — Kya Kya Banaya Hai

| Category | Count/Detail |
| --- | --- |
| Modules | 15 |
| User Roles | 7 |
| Database Tables | 30+ |
| API Endpoints | 100+ |
| Background Jobs | 5 queues, 9 job types |
| Cron Schedulers | 4 |
| Socket Events | 4 |
| AI Features | 4 |
| Report Types | 5 |

---

## 💡 31. Naye Developer Ke Liye Tips

- Pehle routes.js dekho — saari APIs ka map
- Har module ka *.route.js — endpoints aur roles
- shared/constants/statuses.js — status flows samjho
- Migrations order mein padho — database schema samjho
- .env.example copy karke .env banao
- npm run migrate then npm run seed — admin user banega
- npm run dev — server start
- Postman/Thunder Client se APIs test karo
- Socket.io client alag se connect karna hoga real-time ke liye

---

## ✅ 32. Aakhri Baat

- Yeh CareCore HMS backend ek complete, production-ready hospital management system hai. Is mein:

- Patient se le kar billing tak poora workflow hai
- Real-time updates Socket.io se
- Background processing BullMQ se
- AI intelligence Gemini se
- File storage Cloudflare R2 par
- Security har level par
- Audit trail compliance ke liye
- Reports admin analytics ke liye
- Koi bhi naya developer is report parh kar samajh sakta hai ke kya banaya gaya, kaise kaam karta hai, aur har feature kya action perform karta hai.