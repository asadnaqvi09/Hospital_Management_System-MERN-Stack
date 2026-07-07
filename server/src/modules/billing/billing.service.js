import PDFDocument from "pdfkit"

export const buildInvoicePdf = ({ invoice, items, payments }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks = []

    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    doc.fontSize(20).text("CareCore HMS — Invoice Receipt", { align: "center" })
    doc.moveDown()
    doc.fontSize(10)
    doc.text(`Invoice ID: ${invoice.id}`)
    doc.text(`Patient: ${invoice.patient_name || invoice.patient_id} (${invoice.patient_mrn || "N/A"})`)
    doc.text(`Status: ${invoice.status}`)
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleString()}`)
    doc.moveDown()

    doc.fontSize(12).text("Line Items", { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(10)

    for (const item of items) {
      doc.text(
        `${item.description} [${item.category || "general"}] — Qty: ${item.quantity} × ${item.unit_price} = ${item.total}`
      )
    }

    doc.moveDown()
    doc.text(`Subtotal: ${invoice.subtotal}`)
    doc.text(`Discount: ${invoice.discount_amount}${invoice.discount_reason ? ` (${invoice.discount_reason})` : ""}`)
    doc.text(`Tax: ${invoice.tax_amount}`)
    doc.text(`Total: ${invoice.total}`)
    doc.text(`Paid: ${invoice.paid_amount}`)
    doc.text(`Balance: ${Number(invoice.total) - Number(invoice.paid_amount)}`)

    if (invoice.insurance_provider) {
      doc.moveDown()
      doc.text(`Insurance: ${invoice.insurance_provider} — Policy: ${invoice.insurance_policy || "N/A"}`)
      doc.text(`Insurance Covered: ${invoice.insurance_covered}`)
    }

    if (payments.length > 0) {
      doc.moveDown()
      doc.fontSize(12).text("Payments", { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(10)
      for (const payment of payments) {
        doc.text(
          `${new Date(payment.paid_at).toLocaleString()} — ${payment.method}: ${payment.amount}${payment.reference ? ` (Ref: ${payment.reference})` : ""}`
        )
      }
    }

    doc.end()
  })
}
