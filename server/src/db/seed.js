import { pool, closeDatabasePool } from "../shared/config/db.js"
import { hashPassword } from "../shared/utils/hash.js"
import { logger } from "../shared/utils/logger.js"
import { ROLES } from "../shared/constants/roles.js"

const DEMO_DOMAIN = "@carecore.local"

const seedConfig = () => ({
  admin: {
    email: process.env.SEED_ADMIN_EMAIL || "admin@carecore.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
    name: process.env.SEED_ADMIN_NAME || "System Administrator",
    phone: process.env.SEED_ADMIN_PHONE || "+923001000001"
  },
  doctor: {
    email: process.env.SEED_DOCTOR_EMAIL || "doctor@carecore.local",
    password: process.env.SEED_DOCTOR_PASSWORD || "Staff@12345",
    name: process.env.SEED_DOCTOR_NAME || "Dr. Ahmed Khan",
    phone: process.env.SEED_DOCTOR_PHONE || "+923001000002"
  },
  doctor2: {
    email: process.env.SEED_DOCTOR2_EMAIL || "doctor2@carecore.local",
    password: process.env.SEED_DOCTOR2_PASSWORD || "Staff@12345",
    name: process.env.SEED_DOCTOR2_NAME || "Dr. Sara Ali",
    phone: process.env.SEED_DOCTOR2_PHONE || "+923001000003"
  },
  patient: {
    email: process.env.SEED_PATIENT_EMAIL || "patient@carecore.local",
    password: process.env.SEED_PATIENT_PASSWORD || "Patient@12345",
    name: process.env.SEED_PATIENT_NAME || "Fatima Hassan",
    phone: process.env.SEED_PATIENT_PHONE || "+923001000010"
  },
  patient2: {
    email: process.env.SEED_PATIENT2_EMAIL || "patient2@carecore.local",
    password: process.env.SEED_PATIENT2_PASSWORD || "Patient@12345",
    name: process.env.SEED_PATIENT2_NAME || "Hassan Raza",
    phone: process.env.SEED_PATIENT2_PHONE || "+923001000011"
  },
  receptionist: {
    email: process.env.SEED_RECEPTIONIST_EMAIL || "reception@carecore.local",
    password: process.env.SEED_RECEPTIONIST_PASSWORD || "Staff@12345",
    name: process.env.SEED_RECEPTIONIST_NAME || "Ayesha Malik",
    phone: process.env.SEED_RECEPTIONIST_PHONE || "+923001000004"
  },
  pharmacist: {
    email: process.env.SEED_PHARMACIST_EMAIL || "pharmacy@carecore.local",
    password: process.env.SEED_PHARMACIST_PASSWORD || "Staff@12345",
    name: process.env.SEED_PHARMACIST_NAME || "Usman Tariq",
    phone: process.env.SEED_PHARMACIST_PHONE || "+923001000005"
  },
  labTechnician: {
    email: process.env.SEED_LAB_EMAIL || "lab@carecore.local",
    password: process.env.SEED_LAB_PASSWORD || "Staff@12345",
    name: process.env.SEED_LAB_NAME || "Bilal Ahmed",
    phone: process.env.SEED_LAB_PHONE || "+923001000006"
  },
  nurse: {
    email: process.env.SEED_NURSE_EMAIL || "nurse@carecore.local",
    password: process.env.SEED_NURSE_PASSWORD || "Staff@12345",
    name: process.env.SEED_NURSE_NAME || "Nida Shah",
    phone: process.env.SEED_NURSE_PHONE || "+923001000007"
  }
})

const formatDate = (date) => date.toISOString().slice(0, 10)

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const nextMrn = async (client) => {
  const result = await client.query(
    `SELECT 'CC' || LPAD(nextval('patient_mrn_seq')::text, 6, '0') AS mrn`
  )
  return result.rows[0].mrn
}

const getOrCreateUser = async (client, { email, password, fullName, role, phone }) => {
  const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [email])
  if (existing.rowCount > 0) {
    return existing.rows[0].id
  }

  const passwordHash = await hashPassword(password)
  const result = await client.query(
    `INSERT INTO users (email, phone, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     RETURNING id`,
    [email, phone, passwordHash, fullName, role]
  )
  return result.rows[0].id
}

const isDemoSeeded = async () => {
  const cfg = seedConfig()
  const result = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [cfg.doctor.email])
  return result.rowCount > 0
}

const resetDemoData = async (client) => {
  logger.warn("SEED_RESET=true — wiping demo data and reseeding")

  await client.query(`
    TRUNCATE TABLE
      payments,
      invoice_items,
      invoices,
      medicine_dispensing,
      prescription_items,
      prescriptions,
      diagnoses,
      consultations,
      lab_order_items,
      lab_orders,
      nursing_notes,
      patient_vitals,
      admissions,
      appointments,
      patient_allergies,
      patient_conditions,
      patient_documents,
      notifications,
      medicine_batches,
      medicines,
      lab_tests,
      rooms,
      doctor_leaves,
      doctor_schedules,
      doctors,
      patients,
      refresh_tokens,
      users
    RESTART IDENTITY CASCADE
  `)

  await client.query(`ALTER SEQUENCE IF EXISTS patient_mrn_seq RESTART WITH 1000`)
}

const seedUsers = async (client, cfg) => {
  const ids = {
    admin: await getOrCreateUser(client, { ...cfg.admin, fullName: cfg.admin.name, role: ROLES.ADMIN }),
    doctor: await getOrCreateUser(client, { ...cfg.doctor, fullName: cfg.doctor.name, role: ROLES.DOCTOR }),
    doctor2: await getOrCreateUser(client, { ...cfg.doctor2, fullName: cfg.doctor2.name, role: ROLES.DOCTOR }),
    patient: await getOrCreateUser(client, { ...cfg.patient, fullName: cfg.patient.name, role: ROLES.PATIENT }),
    patient2: await getOrCreateUser(client, { ...cfg.patient2, fullName: cfg.patient2.name, role: ROLES.PATIENT }),
    receptionist: await getOrCreateUser(client, {
      ...cfg.receptionist,
      fullName: cfg.receptionist.name,
      role: ROLES.RECEPTIONIST
    }),
    pharmacist: await getOrCreateUser(client, {
      ...cfg.pharmacist,
      fullName: cfg.pharmacist.name,
      role: ROLES.PHARMACIST
    }),
    labTechnician: await getOrCreateUser(client, {
      ...cfg.labTechnician,
      fullName: cfg.labTechnician.name,
      role: ROLES.LAB_TECHNICIAN
    }),
    nurse: await getOrCreateUser(client, { ...cfg.nurse, fullName: cfg.nurse.name, role: ROLES.NURSE })
  }

  return ids
}

const seedDoctors = async (client, userIds) => {
  const doctor1 = await client.query(
    `INSERT INTO doctors (user_id, specialization, qualification, experience_years, license_number, consultation_fee, department, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      userIds.doctor,
      "Cardiology",
      "MBBS, FCPS (Cardiology)",
      12,
      "LIC-2024-001",
      2500,
      "Cardiology",
      "Senior cardiologist specializing in hypertension and heart failure."
    ]
  )

  const doctor2 = await client.query(
    `INSERT INTO doctors (user_id, specialization, qualification, experience_years, license_number, consultation_fee, department, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      userIds.doctor2,
      "General Medicine",
      "MBBS, MRCP",
      8,
      "LIC-2024-002",
      1800,
      "General Medicine",
      "General physician with focus on diabetes and primary care."
    ]
  )

  const doctorIds = {
    ahmed: doctor1.rows[0].id,
    sara: doctor2.rows[0].id
  }

  for (const [doctorId, dayOfWeek] of [
    [doctorIds.ahmed, 1],
    [doctorIds.ahmed, 2],
    [doctorIds.ahmed, 3],
    [doctorIds.ahmed, 4],
    [doctorIds.ahmed, 5],
    [doctorIds.sara, 1],
    [doctorIds.sara, 3],
    [doctorIds.sara, 5]
  ]) {
    await client.query(
      `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, max_patients)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [doctorId, dayOfWeek, "09:00", "13:00", 30, 16]
    )
  }

  await client.query(
    `INSERT INTO doctor_leaves (doctor_id, start_date, end_date, reason, approved_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [doctorIds.ahmed, formatDate(addDays(new Date(), 14)), formatDate(addDays(new Date(), 16)), "Conference", userIds.admin]
  )

  return doctorIds
}

const seedPatients = async (client, userIds) => {
  const patients = []

  const portalPatients = [
    {
      userId: userIds.patient,
      fullName: seedConfig().patient.name,
      cnic: "3520112345671",
      dob: "1992-04-18",
      gender: "female",
      bloodGroup: "B+",
      phone: seedConfig().patient.phone,
      address: "House 12, Street 4, Gulberg, Lahore"
    },
    {
      userId: userIds.patient2,
      fullName: seedConfig().patient2.name,
      cnic: "3520212345672",
      dob: "1988-11-02",
      gender: "male",
      bloodGroup: "O+",
      phone: seedConfig().patient2.phone,
      address: "Flat 3B, DHA Phase 5, Karachi"
    }
  ]

  for (const p of portalPatients) {
    const mrn = await nextMrn(client)
    const result = await client.query(
      `INSERT INTO patients
        (user_id, mrn, full_name, cnic, date_of_birth, gender, blood_group, phone, address,
         emergency_contact_name, emergency_contact_phone, registered_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, mrn, full_name`,
      [
        p.userId,
        mrn,
        p.fullName,
        p.cnic,
        p.dob,
        p.gender,
        p.bloodGroup,
        p.phone,
        p.address,
        "Emergency Contact",
        "+923009999999",
        userIds.receptionist
      ]
    )
    patients.push(result.rows[0])
  }

  const walkInPatients = [
    {
      fullName: "Muhammad Ali",
      cnic: "3520312345673",
      dob: "1975-06-12",
      gender: "male",
      bloodGroup: "A+",
      phone: "+923001000020",
      address: "Model Town, Lahore"
    },
    {
      fullName: "Amina Bibi",
      cnic: "3520412345674",
      dob: "1968-01-25",
      gender: "female",
      bloodGroup: "AB+",
      phone: "+923001000021",
      address: "Johar Town, Lahore"
    },
    {
      fullName: "Zainab Qureshi",
      cnic: "3520512345675",
      dob: "2001-09-08",
      gender: "female",
      bloodGroup: "B-",
      phone: "+923001000022",
      address: "Faisalabad"
    },
    {
      fullName: "Imran Siddiqui",
      cnic: "3520612345676",
      dob: "1995-03-30",
      gender: "male",
      bloodGroup: "O-",
      phone: "+923001000023",
      address: "Islamabad"
    }
  ]

  for (const p of walkInPatients) {
    const mrn = await nextMrn(client)
    const result = await client.query(
      `INSERT INTO patients
        (mrn, full_name, cnic, date_of_birth, gender, blood_group, phone, address,
         emergency_contact_name, emergency_contact_phone, registered_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, mrn, full_name`,
      [
        mrn,
        p.fullName,
        p.cnic,
        p.dob,
        p.gender,
        p.bloodGroup,
        p.phone,
        p.address,
        "Family Member",
        "+923008888888",
        userIds.receptionist
      ]
    )
    patients.push(result.rows[0])
  }

  const fatima = patients[0]
  const hassan = patients[1]

  await client.query(
    `INSERT INTO patient_allergies (patient_id, allergen, reaction, severity, added_by)
     VALUES
       ($1, 'Penicillin', 'Skin rash and itching', 'moderate', $2),
       ($1, 'Peanuts', 'Mild swelling', 'mild', $2)`,
    [fatima.id, userIds.doctor]
  )

  await client.query(
    `INSERT INTO patient_conditions (patient_id, condition_name, icd_code, diagnosed_date, status, notes, added_by)
     VALUES
       ($1, 'Type 2 Diabetes Mellitus', 'E11.9', $3, 'chronic', 'On metformin', $2),
       ($1, 'Essential Hypertension', 'I10', $4, 'active', 'Controlled with medication', $2)`,
    [fatima.id, userIds.doctor, "2020-03-15", "2019-08-20"]
  )

  await client.query(
    `INSERT INTO patient_conditions (patient_id, condition_name, icd_code, diagnosed_date, status, added_by)
     VALUES ($1, 'Seasonal Allergic Rhinitis', 'J30.1', $3, 'active', $2)`,
    [hassan.id, userIds.doctor, "2022-05-10"]
  )

  return { all: patients, fatima, hassan, ali: patients[2], amina: patients[3], zainab: patients[4], imran: patients[5] }
}

const seedMedicines = async (client) => {
  const medicines = [
    {
      name: "Panadol 500mg",
      generic: "Paracetamol",
      category: "Analgesic",
      unit: "tablet",
      stock: 420,
      reorder: 100,
      purchase: 2.5,
      sale: 5,
      supplier: "GSK Pakistan"
    },
    {
      name: "Augmentin 625mg",
      generic: "Amoxicillin + Clavulanate",
      category: "Antibiotic",
      unit: "tablet",
      stock: 35,
      reorder: 50,
      purchase: 18,
      sale: 32,
      supplier: "Getz Pharma"
    },
    {
      name: "Glucophage 500mg",
      generic: "Metformin",
      category: "Antidiabetic",
      unit: "tablet",
      stock: 280,
      reorder: 80,
      purchase: 4,
      sale: 8,
      supplier: "Merck"
    },
    {
      name: "Disprin 75mg",
      generic: "Aspirin",
      category: "Antiplatelet",
      unit: "tablet",
      stock: 95,
      reorder: 40,
      purchase: 1.8,
      sale: 4,
      supplier: "Reckitt"
    },
    {
      name: "Lipitor 10mg",
      generic: "Atorvastatin",
      category: "Statin",
      unit: "tablet",
      stock: 12,
      reorder: 30,
      purchase: 22,
      sale: 45,
      supplier: "Pfizer"
    }
  ]

  const ids = {}

  for (const med of medicines) {
    const result = await client.query(
      `INSERT INTO medicines (name, generic_name, category, unit, stock_quantity, reorder_level, purchase_price, sale_price, supplier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name`,
      [
        med.name,
        med.generic,
        med.category,
        med.unit,
        med.stock,
        med.reorder,
        med.purchase,
        med.sale,
        med.supplier
      ]
    )
    ids[med.generic] = result.rows[0].id

    const expiryNear = formatDate(addDays(new Date(), 25))
    const expiryFar = formatDate(addDays(new Date(), 365))

    await client.query(
      `INSERT INTO medicine_batches (medicine_id, batch_number, quantity, expiry_date)
       VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
      [result.rows[0].id, `BATCH-${med.name.slice(0, 3).toUpperCase()}-001`, Math.floor(med.stock * 0.7), expiryFar, `BATCH-${med.name.slice(0, 3).toUpperCase()}-002`, Math.ceil(med.stock * 0.3), expiryNear]
    )
  }

  return ids
}

const seedLabTests = async (client) => {
  const tests = [
    ["Complete Blood Count (CBC)", "haematology", "cells/uL", "4.5–11.0 x10^9/L", 3.5, 15, 1200],
    ["Fasting Blood Glucose", "biochemistry", "mg/dL", "70–100", 50, 400, 800],
    ["HbA1c", "biochemistry", "%", "4.0–5.6", 3, 14, 1500],
    ["Lipid Profile", "biochemistry", "mg/dL", "Varies", null, null, 2200],
    ["Urine Routine Examination", "microbiology", "—", "Normal", null, null, 600]
  ]

  const ids = []

  for (const [name, category, unit, normalRange, criticalLow, criticalHigh, price] of tests) {
    const result = await client.query(
      `INSERT INTO lab_tests (name, category, unit, normal_range, critical_low, critical_high, price, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id, name`,
      [name, category, unit, normalRange, criticalLow, criticalHigh, price]
    )
    ids.push(result.rows[0])
  }

  return ids
}

const seedRooms = async (client) => {
  const rooms = [
    ["G-101", "General", 1, 2, 3500, "available"],
    ["G-102", "General", 1, 2, 3500, "occupied"],
    ["G-103", "General", 1, 2, 3500, "maintenance"],
    ["ICU-01", "ICU", 2, 1, 12000, "occupied"],
    ["PVT-201", "Private", 2, 1, 8000, "available"]
  ]

  const ids = {}

  for (const [roomNumber, ward, floor, capacity, dailyRate, status] of rooms) {
    const result = await client.query(
      `INSERT INTO rooms (room_number, ward, floor, capacity, daily_rate, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, room_number`,
      [roomNumber, ward, floor, capacity, dailyRate, status]
    )
    ids[roomNumber] = result.rows[0].id
  }

  return ids
}

const seedAppointmentsAndClinical = async (client, { userIds, doctorIds, patients }) => {
  const today = new Date()
  const todayStr = formatDate(today)
  const yesterdayStr = formatDate(addDays(today, -1))
  const lastWeekStr = formatDate(addDays(today, -7))

  const todaySlots = [
    { time: "09:00", patient: patients.ali, status: "scheduled", complaint: "Chest discomfort" },
    { time: "09:30", patient: patients.fatima, status: "confirmed", complaint: "Follow-up diabetes review" },
    { time: "10:00", patient: patients.amina, status: "checked_in", complaint: "High blood pressure" },
    { time: "10:30", patient: patients.hassan, status: "in_consultation", complaint: "Persistent cough" },
    { time: "11:00", patient: patients.zainab, status: "completed", complaint: "Fever and body aches" }
  ]

  const appointmentIds = {}

  for (const slot of todaySlots) {
    const result = await client.query(
      `INSERT INTO appointments
        (patient_id, doctor_id, appointment_date, slot_time, type, status, chief_complaint, booking_source, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        slot.patient.id,
        doctorIds.ahmed,
        todayStr,
        slot.time,
        slot.patient.id === patients.fatima.id ? "follow_up" : "booked",
        slot.status,
        slot.complaint,
        slot.patient.id === patients.fatima.id ? "patient" : "receptionist",
        userIds.receptionist
      ]
    )
    appointmentIds[slot.status] = result.rows[0].id
  }

  await client.query(
    `INSERT INTO appointments
      (patient_id, doctor_id, appointment_date, slot_time, type, status, chief_complaint, booking_source, created_by, no_show_probability)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      patients.imran.id,
      doctorIds.sara,
      todayStr,
      "11:30",
      "booked",
      "scheduled",
      "General checkup",
      "patient",
      userIds.patient2,
      72
    ]
  )

  const pastCompleted = await client.query(
    `INSERT INTO appointments
      (patient_id, doctor_id, appointment_date, slot_time, type, status, chief_complaint, booking_source, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      patients.fatima.id,
      doctorIds.ahmed,
      yesterdayStr,
      "10:00",
      "follow_up",
      "completed",
      "Diabetes follow-up",
      "receptionist",
      userIds.receptionist
    ]
  )

  await client.query(
    `INSERT INTO appointments
      (patient_id, doctor_id, appointment_date, slot_time, type, status, chief_complaint, booking_source, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      patients.hassan.id,
      doctorIds.sara,
      lastWeekStr,
      "09:30",
      "booked",
      "no_show",
      "Skin rash",
      "patient",
      userIds.patient2
    ]
  )

  const completedApptId = appointmentIds.completed
  const consultation = await client.query(
    `INSERT INTO consultations
      (appointment_id, doctor_id, patient_id, chief_complaint, hopi, examination, diagnosis_text, management_plan, follow_up_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      completedApptId,
      doctorIds.ahmed,
      patients.zainab.id,
      "Fever and body aches for 3 days",
      "Patient reports intermittent fever up to 101F with myalgia. No travel history.",
      "Temp 38.2C, throat mildly erythematous, chest clear, no lymphadenopathy.",
      "Likely viral upper respiratory tract infection",
      "Rest, fluids, symptomatic treatment. Return if worsening.",
      formatDate(addDays(today, 7))
    ]
  )
  const consultationId = consultation.rows[0].id

  await client.query(
    `INSERT INTO diagnoses (consultation_id, icd_code, description, type)
     VALUES ($1, $2, $3, $4)`,
    [consultationId, "J06.9", "Acute upper respiratory infection, unspecified", "primary"]
  )

  const yesterdayConsultation = await client.query(
    `INSERT INTO consultations
      (appointment_id, doctor_id, patient_id, chief_complaint, hopi, examination, diagnosis_text, management_plan, is_locked)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
     RETURNING id`,
    [
      pastCompleted.rows[0].id,
      doctorIds.ahmed,
      patients.fatima.id,
      "Diabetes follow-up",
      "Stable on current regimen. No hypoglycemic episodes.",
      "BP 128/82, BMI 27. Foot exam normal.",
      "Type 2 diabetes — stable",
      "Continue metformin. Repeat HbA1c in 3 months.",
    ]
  )

  await client.query(
    `INSERT INTO patient_vitals
      (patient_id, recorded_by, appointment_id, bp_systolic, bp_diastolic, heart_rate, temperature, weight_kg, height_cm, spo2, notes)
     VALUES
       ($1, $2, $3, 118, 76, 78, 36.8, 62.5, 165, 98, 'Pre-consultation vitals'),
       ($4, $2, $5, 132, 88, 84, 37.1, 78.0, 172, 97, 'Elevated BP noted')`,
    [
      patients.fatima.id,
      userIds.nurse,
      appointmentIds.confirmed,
      patients.amina.id,
      appointmentIds.checked_in
    ]
  )

  return { consultationId, yesterdayConsultationId: yesterdayConsultation.rows[0].id, completedApptId }
}

const seedPrescriptions = async (client, { doctorIds, patients, consultationId, yesterdayConsultationId, medicineIds, userIds }) => {
  const pendingRx = await client.query(
    `INSERT INTO prescriptions (consultation_id, doctor_id, patient_id, notes, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [consultationId, doctorIds.ahmed, patients.zainab.id, "Take after meals", "pending"]
  )

  await client.query(
    `INSERT INTO prescription_items
      (prescription_id, medicine_name, generic_name, dosage, frequency, duration, instructions, quantity, medicine_id)
     VALUES
       ($1, 'Panadol 500mg', 'Paracetamol', '500mg', 'Three times daily', '5 days', 'After meals', 15, $2),
       ($1, 'Augmentin 625mg', 'Amoxicillin + Clavulanate', '625mg', 'Twice daily', '7 days', 'Complete full course', 14, $3)`,
    [pendingRx.rows[0].id, medicineIds.Paracetamol, medicineIds["Amoxicillin + Clavulanate"]]
  )

  const dispensedRx = await client.query(
    `INSERT INTO prescriptions (consultation_id, doctor_id, patient_id, notes, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [yesterdayConsultationId, doctorIds.ahmed, patients.fatima.id, "Continue chronic meds", "dispensed"]
  )

  await client.query(
    `INSERT INTO prescription_items
      (prescription_id, medicine_name, generic_name, dosage, frequency, duration, instructions, quantity, medicine_id, dispensed_quantity)
     VALUES ($1, 'Glucophage 500mg', 'Metformin', '500mg', 'Twice daily', '30 days', 'With meals', 60, $2, 60)`,
    [dispensedRx.rows[0].id, medicineIds.Metformin]
  )

  await client.query(
    `INSERT INTO medicine_dispensing (prescription_id, dispensed_by, notes)
     VALUES ($1, $2, $3)`,
    [dispensedRx.rows[0].id, userIds.pharmacist, "Full quantity dispensed from batch BATCH-GLU-001"]
  )
}

const seedLabOrders = async (client, { doctorIds, patients, consultationId, yesterdayConsultationId, labTests, userIds }) => {
  const ordered = await client.query(
    `INSERT INTO lab_orders (patient_id, doctor_id, consultation_id, status, priority)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [patients.fatima.id, doctorIds.ahmed, yesterdayConsultationId, "ordered", "routine"]
  )

  const sampleCollected = await client.query(
    `INSERT INTO lab_orders (patient_id, doctor_id, consultation_id, status, priority, sample_collected_at, collected_by)
     VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '2 hours', $6)
     RETURNING id`,
    [patients.hassan.id, doctorIds.sara, null, "sample_collected", "urgent", userIds.labTechnician]
  )

  const processing = await client.query(
    `INSERT INTO lab_orders (patient_id, doctor_id, status, priority, sample_collected_at, collected_by)
     VALUES ($1, $2, $3, $4, NOW() - INTERVAL '4 hours', $5)
     RETURNING id`,
    [patients.ali.id, doctorIds.ahmed, "processing", "routine", userIds.labTechnician]
  )

  const completed = await client.query(
    `INSERT INTO lab_orders (patient_id, doctor_id, consultation_id, status, priority, completed_at, sample_collected_at, collected_by)
     VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', $6)
     RETURNING id`,
    [patients.zainab.id, doctorIds.ahmed, consultationId, "completed", "routine", userIds.labTechnician]
  )

  const attachTests = async (orderId, testIndexes) => {
    for (const index of testIndexes) {
      await client.query(`INSERT INTO lab_order_items (lab_order_id, test_id) VALUES ($1, $2)`, [orderId, labTests[index].id])
    }
  }

  await attachTests(ordered.rows[0].id, [1, 2])
  await attachTests(sampleCollected.rows[0].id, [0])
  await attachTests(processing.rows[0].id, [0, 3])
  await attachTests(completed.rows[0].id, [0, 1])

  const completedItems = await client.query(`SELECT id, test_id FROM lab_order_items WHERE lab_order_id = $1`, [
    completed.rows[0].id
  ])

  for (const [index, item] of completedItems.rows.entries()) {
    const values =
      index === 0
        ? { result_value: "11.2", result_numeric: 11.2, is_abnormal: true, is_critical: false, notes: "Slightly elevated WBC" }
        : { result_value: "92", result_numeric: 92, is_abnormal: false, is_critical: false, notes: "Within normal range" }

    await client.query(
      `UPDATE lab_order_items
       SET result_value = $2, result_numeric = $3, is_abnormal = $4, is_critical = $5, notes = $6,
           processed_by = $7, processed_at = NOW() - INTERVAL '20 hours'
       WHERE id = $1`,
      [item.id, values.result_value, values.result_numeric, values.is_abnormal, values.is_critical, values.notes, userIds.labTechnician]
    )
  }
}

const seedIpd = async (client, { doctorIds, patients, roomIds, userIds }) => {
  const admission1 = await client.query(
    `INSERT INTO admissions (patient_id, admitting_doctor, room_id, expected_days, admission_reason, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [patients.amina.id, doctorIds.ahmed, roomIds["G-102"], 3, "Observation for hypertensive urgency", "admitted"]
  )

  const admission2 = await client.query(
    `INSERT INTO admissions (patient_id, admitting_doctor, room_id, expected_days, admission_reason, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [patients.imran.id, doctorIds.sara, roomIds["ICU-01"], 5, "Post-operative monitoring", "admitted"]
  )

  await client.query(
    `INSERT INTO nursing_notes (admission_id, nurse_id, shift, note)
     VALUES
       ($1, $2, 'morning', 'Patient stable. BP monitored every 4 hours.'),
       ($1, $2, 'afternoon', 'Diet tolerated. No complaints of dizziness.'),
       ($3, $2, 'night', 'Vitals stable overnight. Pain score 2/10.')`,
    [admission1.rows[0].id, userIds.nurse, admission2.rows[0].id]
  )

  await client.query(
    `INSERT INTO patient_vitals
      (patient_id, recorded_by, admission_id, bp_systolic, bp_diastolic, heart_rate, temperature, spo2, notes)
     VALUES ($1, $2, $3, 148, 92, 88, 37.0, 96, 'Ward admission vitals')`,
    [patients.amina.id, userIds.nurse, admission1.rows[0].id]
  )
}

const seedBilling = async (client, { patients, consultationId, userIds, doctorIds }) => {
  const draftInvoice = await client.query(
    `INSERT INTO invoices (patient_id, consultation_id, subtotal, total, paid_amount, status, created_by)
     VALUES ($1, $2, $3, $3, 0, 'draft', $4)
     RETURNING id`,
    [patients.zainab.id, consultationId, 4000, userIds.receptionist]
  )

  await client.query(
    `INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price, total)
     VALUES
       ($1, 'Cardiology consultation', 'consultation', 1, 2500, 2500),
       ($1, 'CBC lab test', 'lab', 1, 1200, 1200),
       ($1, 'Registration fee', 'procedure', 1, 300, 300)`,
    [draftInvoice.rows[0].id]
  )

  const finalizedInvoice = await client.query(
    `INSERT INTO invoices (patient_id, subtotal, total, paid_amount, status, created_by)
     VALUES ($1, $2, $2, 0, 'finalized', $3)
     RETURNING id`,
    [patients.hassan.id, 1800, userIds.receptionist]
  )

  await client.query(
    `INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price, total)
     VALUES ($1, 'General medicine consultation', 'consultation', 1, 1800, 1800)`,
    [finalizedInvoice.rows[0].id]
  )

  const partialInvoice = await client.query(
    `INSERT INTO invoices (patient_id, subtotal, discount_amount, discount_reason, total, paid_amount, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'partially_paid', $7)
     RETURNING id`,
    [patients.fatima.id, 5000, 500, "Staff discount", 4500, 2000, userIds.receptionist]
  )

  await client.query(
    `INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price, total)
     VALUES
       ($1, 'Cardiology follow-up', 'consultation', 1, 2500, 2500),
       ($1, 'HbA1c test', 'lab', 1, 1500, 1500),
       ($1, 'Metformin dispensed', 'medicine', 1, 1000, 1000)`,
    [partialInvoice.rows[0].id]
  )

  await client.query(
    `INSERT INTO payments (invoice_id, amount, method, reference, received_by)
     VALUES ($1, $2, 'cash', 'RCPT-1001', $3)`,
    [partialInvoice.rows[0].id, 2000, userIds.receptionist]
  )

  const paidInvoice = await client.query(
    `INSERT INTO invoices (patient_id, subtotal, total, paid_amount, status, created_by)
     VALUES ($1, $2, $2, $2, 'fully_paid', $3)
     RETURNING id`,
    [patients.ali.id, 3200, userIds.receptionist]
  )

  await client.query(
    `INSERT INTO invoice_items (invoice_id, description, category, quantity, unit_price, total)
     VALUES
       ($1, 'Consultation fee', 'consultation', 1, 2500, 2500),
       ($1, 'Lipid profile', 'lab', 1, 700, 700)`,
    [paidInvoice.rows[0].id]
  )

  await client.query(
    `INSERT INTO payments (invoice_id, amount, method, reference, received_by)
     VALUES ($1, $2, 'card', 'POS-88421', $3)`,
    [paidInvoice.rows[0].id, 3200, userIds.receptionist]
  )
}

const seedNotifications = async (client, userIds) => {
  const notifications = [
    [userIds.doctor, "appointment", "New appointment booked", "Fatima Hassan booked a follow-up for today at 09:30.", "appointment"],
    [userIds.pharmacist, "prescription", "Prescription pending", "A new prescription for Zainab Qureshi is awaiting dispensing.", "prescription"],
    [userIds.labTechnician, "lab_order", "New lab order", "Fasting glucose and HbA1c ordered for Fatima Hassan.", "lab_order"],
    [userIds.receptionist, "billing", "Outstanding invoice", "Hassan Raza has a finalized unpaid invoice.", "invoice"],
    [userIds.nurse, "ipd", "Vitals due", "Amina Bibi (G-102) needs vitals recorded this shift.", "admission"],
    [userIds.patient, "lab_order", "Lab report ready", "Your CBC results from yesterday are now available.", "lab_order"],
    [userIds.admin, "inventory", "Low stock alert", "Augmentin 625mg is below reorder level.", "medicine"]
  ]

  for (const [userId, type, title, message, entityType] of notifications) {
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, entity_type, is_read)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, message, entityType, false]
    )
  }
}

const printCredentialSummary = (cfg) => {
  const rows = [
    ["Admin", cfg.admin.email, cfg.admin.password],
    ["Doctor (Cardiology)", cfg.doctor.email, cfg.doctor.password],
    ["Doctor (General)", cfg.doctor2.email, cfg.doctor2.password],
    ["Patient (Fatima)", cfg.patient.email, cfg.patient.password],
    ["Patient (Hassan)", cfg.patient2.email, cfg.patient2.password],
    ["Receptionist", cfg.receptionist.email, cfg.receptionist.password],
    ["Pharmacist", cfg.pharmacist.email, cfg.pharmacist.password],
    ["Lab Technician", cfg.labTechnician.email, cfg.labTechnician.password],
    ["Nurse", cfg.nurse.email, cfg.nurse.password]
  ]

  logger.info("═══════════════════════════════════════════════════════════")
  logger.info("CareCore HMS — Demo login credentials")
  logger.info("═══════════════════════════════════════════════════════════")
  for (const [role, email, password] of rows) {
    logger.info(`${role.padEnd(22)} | ${email.padEnd(28)} | ${password}`)
  }
  logger.info("═══════════════════════════════════════════════════════════")
  logger.info("Demo data includes: 2 doctors, 6 patients, medicines, lab tests,")
  logger.info("today's appointment queue, prescriptions, lab orders, IPD admissions,")
  logger.info("invoices (draft/finalized/partial/paid), and sample notifications.")
  logger.info("Re-run with SEED_RESET=true to wipe and reseed demo data.")
}

const runSeed = async () => {
  const cfg = seedConfig()
  const shouldReset = process.env.SEED_RESET === "true"

  if (!shouldReset && (await isDemoSeeded())) {
    logger.info(`Demo data already exists (found ${cfg.doctor.email}). Skipping seed.`)
    logger.info("Set SEED_RESET=true in .env to wipe demo data and reseed.")
    printCredentialSummary(cfg)
    return
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    if (shouldReset) {
      await resetDemoData(client)
    } else if (await isDemoSeeded()) {
      await client.query("ROLLBACK")
      logger.info("Demo data already seeded.")
      printCredentialSummary(cfg)
      return
    }

    const userIds = await seedUsers(client, cfg)
    const doctorIds = await seedDoctors(client, userIds)
    const patients = await seedPatients(client, userIds)
    const medicineIds = await seedMedicines(client)
    const labTests = await seedLabTests(client)
    const roomIds = await seedRooms(client)

    const clinical = await seedAppointmentsAndClinical(client, { userIds, doctorIds, patients })

    await seedPrescriptions(client, {
      doctorIds,
      patients,
      consultationId: clinical.consultationId,
      yesterdayConsultationId: clinical.yesterdayConsultationId,
      medicineIds,
      userIds
    })

    await seedLabOrders(client, {
      doctorIds,
      patients,
      consultationId: clinical.consultationId,
      yesterdayConsultationId: clinical.yesterdayConsultationId,
      labTests,
      userIds
    })

    await seedIpd(client, { doctorIds, patients, roomIds, userIds })
    await seedBilling(client, { patients, consultationId: clinical.consultationId, userIds, doctorIds })
    await seedNotifications(client, userIds)

    await client.query("COMMIT")
    logger.info("Database seeding completed successfully")
    printCredentialSummary(cfg)
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

runSeed()
  .then(async () => {
    await closeDatabasePool()
    process.exit(0)
  })
  .catch(async (error) => {
    logger.error(`Seeding process aborted: ${error.message}`)
    await closeDatabasePool()
    process.exit(1)
  })
