import PDFDocument from "pdfkit"

export const parseNormalRange = (rangeText) => {
  if (!rangeText || typeof rangeText !== "string") {
    return null
  }
  const trimmed = rangeText.trim()
  const lessThanMatch = trimmed.match(/^<\s*([\d.]+)/)
  if (lessThanMatch) {
    return { low: null, high: Number(lessThanMatch[1]), exclusiveHigh: true }
  }
  const greaterThanMatch = trimmed.match(/^>\s*([\d.]+)/)
  if (greaterThanMatch) {
    return { low: Number(greaterThanMatch[1]), high: null, exclusiveLow: true }
  }
  const rangeMatch = trimmed.match(/^([\d.]+)\s*[-–]\s*([\d.]+)/)
  if (rangeMatch) {
    return { low: Number(rangeMatch[1]), high: Number(rangeMatch[2]) }
  }
  return null
}

export const evaluateResult = (test, resultNumeric) => {
  if (resultNumeric === null || resultNumeric === undefined || Number.isNaN(Number(resultNumeric))) {
    return { isAbnormal: false, isCritical: false }
  }
  const value = Number(resultNumeric)
  let isAbnormal = false
  let isCritical = false

  const range = parseNormalRange(test.normal_range)
  if (range) {
    if (range.low !== null && range.high !== null) {
      isAbnormal = value < range.low || value > range.high
    } else if (range.exclusiveHigh && range.high !== null) {
      isAbnormal = value >= range.high
    } else if (range.exclusiveLow && range.low !== null) {
      isAbnormal = value <= range.low
    }
  }

  if (test.critical_low !== null && value < Number(test.critical_low)) {
    isCritical = true
  }
  if (test.critical_high !== null && value > Number(test.critical_high)) {
    isCritical = true
  }

  return { isAbnormal, isCritical }
}

export const buildLabReportPdf = ({ order, items, patient, doctor }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks = []

    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    doc.fontSize(18).text("Laboratory Report", { align: "center" })
    doc.moveDown()
    doc.fontSize(10)
    doc.text(`Order ID: ${order.id}`)
    doc.text(`Patient: ${patient.full_name} (MRN: ${patient.mrn})`)
    doc.text(`Doctor: ${doctor.full_name || "N/A"}`)
    doc.text(`Ordered: ${new Date(order.ordered_at).toLocaleString()}`)
    doc.text(`Completed: ${order.completed_at ? new Date(order.completed_at).toLocaleString() : "N/A"}`)
    doc.moveDown()

    doc.fontSize(12).text("Results", { underline: true })
    doc.moveDown(0.5)

    for (const item of items) {
      doc.fontSize(10).text(item.test_name, { continued: false })
      doc.text(`  Result: ${item.result_value ?? item.result_numeric ?? "N/A"} ${item.unit || ""}`)
      if (item.normal_range) {
        doc.text(`  Normal Range: ${item.normal_range}`)
      }
      const flags = []
      if (item.is_critical) {
        flags.push("CRITICAL")
      } else if (item.is_abnormal) {
        flags.push("ABNORMAL")
      }
      if (flags.length > 0) {
        doc.fillColor("red").text(`  Flags: ${flags.join(", ")}`).fillColor("black")
      }
      if (item.notes) {
        doc.text(`  Notes: ${item.notes}`)
      }
      doc.moveDown(0.5)
    }

    doc.end()
  })
}
