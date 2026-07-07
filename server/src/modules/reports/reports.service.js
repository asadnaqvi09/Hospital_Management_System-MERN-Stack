import PDFDocument from "pdfkit"

const escapeCsvValue = (value) => {
  const text = value === null || value === undefined ? "" : String(value)
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export const buildCsv = (rows, columns) => {
  const header = columns.map((col) => escapeCsvValue(col.label)).join(",")
  const lines = rows.map((row) => columns.map((col) => escapeCsvValue(row[col.key])).join(","))
  return [header, ...lines].join("\n")
}

const reportTitles = {
  revenue: "Revenue Report",
  "patient-volume": "Patient Volume Report",
  "doctor-performance": "Doctor Performance Report",
  "appointment-analytics": "Appointment Analytics Report",
  "bed-occupancy": "Bed Occupancy Report"
}

const reportColumns = {
  revenue: [
    { key: "report_date", label: "Date" },
    { key: "method", label: "Method" },
    { key: "payment_count", label: "Payments" },
    { key: "total_amount", label: "Amount" }
  ],
  "patient-volume": [
    { key: "report_date", label: "Date" },
    { key: "new_patients", label: "New Patients" }
  ],
  "doctor-performance": [
    { key: "doctor_name", label: "Doctor" },
    { key: "department", label: "Department" },
    { key: "completed_appointments", label: "Completed" },
    { key: "no_show_count", label: "No Shows" },
    { key: "consultation_count", label: "Consultations" },
    { key: "revenue_generated", label: "Revenue" }
  ],
  "appointment-analytics": [
    { key: "report_date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "type", label: "Type" },
    { key: "appointment_count", label: "Count" },
    { key: "avg_no_show_probability", label: "Avg No-Show %" }
  ],
  "bed-occupancy": [
    { key: "ward", label: "Ward" },
    { key: "room_number", label: "Room" },
    { key: "capacity", label: "Capacity" },
    { key: "active_admissions", label: "Occupied" },
    { key: "available_beds", label: "Available" },
    { key: "occupancy_rate", label: "Occupancy %" }
  ]
}

export const getReportCsv = (reportType, rows) => {
  const columns = reportColumns[reportType]
  if (!columns) {
    throw new Error(`Unsupported report type: ${reportType}`)
  }
  return buildCsv(rows, columns)
}

export const buildReportPdf = ({ reportType, rows, summary, params }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks = []
    const title = reportTitles[reportType] || "CareCore Report"
    const columns = reportColumns[reportType] || []

    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    doc.fontSize(20).text(`CareCore HMS — ${title}`, { align: "center" })
    doc.moveDown()
    doc.fontSize(10)
    if (params?.fromDate && params?.toDate) {
      doc.text(`Period: ${params.fromDate} to ${params.toDate}`)
    }
    doc.text(`Generated: ${new Date().toLocaleString()}`)
    doc.moveDown()

    if (summary) {
      doc.fontSize(12).text("Summary", { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(10)
      for (const [key, value] of Object.entries(summary)) {
        doc.text(`${key}: ${value}`)
      }
      doc.moveDown()
    }

    doc.fontSize(12).text("Details", { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(9)

    for (const row of rows) {
      const line = columns.map((col) => `${col.label}: ${row[col.key] ?? ""}`).join(" | ")
      doc.text(line)
    }

    doc.end()
  })
}

export const getDefaultDateRange = () => {
  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 30)
  return {
    fromDate: fromDate.toISOString().slice(0, 10),
    toDate: toDate.toISOString().slice(0, 10)
  }
}
