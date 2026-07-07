import { generateAiText, parseAiJson, isAiConfigured } from "../../shared/config/ai.js"
import { logger } from "../../shared/utils/logger.js"
import { emitToUser } from "../../shared/sockets/notification.socket.js"
import { getPatientNoShowStats } from "./ai.model.js"

const SYMPTOM_SYSTEM_PROMPT = `You are a clinical triage assistant for CareCore HMS. Analyze patient symptoms from a chat conversation.
Respond ONLY with valid JSON:
{
  "reply": "empathetic plain-language response to the patient (2-4 sentences)",
  "suggestedDepartment": "department name e.g. General Medicine, Cardiology, Emergency",
  "urgencyLevel": "routine" | "urgent" | "emergency",
  "recommendations": ["actionable step 1", "actionable step 2"]
}
Rules: Never diagnose definitively. Advise emergency care for red-flag symptoms. urgencyLevel must be one of the three allowed values.`

const HISTORY_SYSTEM_PROMPT = `You are a medical records summarizer for clinicians at CareCore HMS.
Given structured patient data from the last 12 months, produce a concise clinical summary.
Respond ONLY with valid JSON:
{
  "summary": "3-6 paragraph condensed narrative for the treating clinician",
  "keyConcerns": ["concern 1", "concern 2"],
  "activeConditions": ["condition 1"],
  "medicationHighlights": ["highlight 1"]
}
Be factual. Only use provided data. Note gaps if data is sparse.`

const NO_SHOW_SYSTEM_PROMPT = `You are a healthcare operations analyst predicting appointment no-shows.
Given appointment and patient attendance history, estimate no-show probability.
Respond ONLY with valid JSON:
{
  "probability": 0-100 integer,
  "riskLevel": "low" | "medium" | "high",
  "factors": ["factor 1", "factor 2"]
}
Base probability on historical no-show rate, booking patterns, and appointment lead time.`

const DRUG_INTERACTION_SYSTEM_PROMPT = `You are a clinical pharmacist assistant. Given medicines, patient allergies, and FDA label excerpts, identify interaction risks.
Respond ONLY with valid JSON:
{
  "hasInteractions": true | false,
  "severity": "none" | "minor" | "moderate" | "major",
  "warnings": [
    { "medicines": ["drug A", "drug B"], "description": "plain-language explanation", "recommendation": "what to do" }
  ],
  "allergyAlerts": [
    { "medicine": "drug name", "allergen": "allergen", "description": "plain-language risk" }
  ]
}
Only flag real concerns supported by the data provided.`

export const buildSymptomUserPrompt = (messages) => {
  const transcript = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n")
  return `Patient conversation:\n${transcript}`
}

export const runSymptomTriage = async (messages) => {
  const raw = await generateAiText({
    systemPrompt: SYMPTOM_SYSTEM_PROMPT,
    userPrompt: buildSymptomUserPrompt(messages),
    jsonMode: true
  })
  const parsed = parseAiJson(raw)
  return {
    aiResponse: parsed.reply || "",
    suggestedDepartment: parsed.suggestedDepartment || null,
    urgencyLevel: parsed.urgencyLevel || "routine",
    recommendations: parsed.recommendations || []
  }
}

export const runHistorySummary = async (historyPayload) => {
  const raw = await generateAiText({
    systemPrompt: HISTORY_SYSTEM_PROMPT,
    userPrompt: `Patient data (last 12 months):\n${JSON.stringify(historyPayload, null, 2)}`,
    jsonMode: true
  })
  const parsed = parseAiJson(raw)
  return {
    summaryText: parsed.summary || "",
    keyConcerns: parsed.keyConcerns || [],
    activeConditions: parsed.activeConditions || [],
    medicationHighlights: parsed.medicationHighlights || []
  }
}

export const runNoShowPrediction = async ({ appointment, stats }) => {
  if (!isAiConfigured()) {
    const total = stats.total_count || 0
    const noShows = stats.no_show_count || 0
    const baseRate = total > 0 ? Math.round((noShows / total) * 100) : 15
    const daysUntil = Math.max(
      0,
      Math.ceil(
        (new Date(`${appointment.appointment_date}T${appointment.slot_time}`) - Date.now()) / 86400000
      )
    )
    const leadBoost = daysUntil > 7 ? 10 : 0
    const probability = Math.min(95, Math.max(5, baseRate + leadBoost))
    return {
      probability,
      riskLevel: probability >= 60 ? "high" : probability >= 35 ? "medium" : "low",
      factors: ["Heuristic score — AI provider not configured"]
    }
  }

  const raw = await generateAiText({
    systemPrompt: NO_SHOW_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ appointment, patientStats: stats }, null, 2),
    jsonMode: true
  })
  const parsed = parseAiJson(raw)
  const probability = Math.min(100, Math.max(0, Math.round(Number(parsed.probability) || 0)))
  return {
    probability,
    riskLevel: parsed.riskLevel || (probability >= 60 ? "high" : probability >= 35 ? "medium" : "low"),
    factors: parsed.factors || []
  }
}

const fetchOpenFdaLabel = async (drugName) => {
  if (!drugName) {
    return null
  }
  try {
    const query = encodeURIComponent(`openfda.generic_name:"${drugName}" OR openfda.brand_name:"${drugName}"`)
    const response = await fetch(`https://api.fda.gov/drug/label.json?search=${query}&limit=1`)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    const label = data.results?.[0]
    if (!label) {
      return null
    }
    return {
      drugName,
      interactions: label.drug_interactions || [],
      warnings: label.warnings || [],
      contraindications: label.contraindications || [],
      description: label.description?.[0] || null
    }
  } catch (error) {
    logger.warn(`OpenFDA lookup failed for ${drugName}: ${error.message}`)
    return null
  }
}

export const fetchDrugLabels = async (medicines) => {
  const names = [...new Set(medicines.map((med) => med.genericName || med.medicineName).filter(Boolean))]
  const labels = await Promise.all(names.map((name) => fetchOpenFdaLabel(name)))
  return labels.filter(Boolean)
}

export const runDrugInteractionCheck = async ({ medicines, allergies, fdaLabels }) => {
  const raw = await generateAiText({
    systemPrompt: DRUG_INTERACTION_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ medicines, allergies, fdaLabels }, null, 2),
    jsonMode: true
  })
  const parsed = parseAiJson(raw)
  return {
    hasInteractions: Boolean(parsed.hasInteractions),
    severity: parsed.severity || "none",
    warnings: parsed.warnings || [],
    allergyAlerts: parsed.allergyAlerts || []
  }
}

export const checkPrescriptionInteractions = async ({ items, allergies }) => {
  const medicines = items.map((item) => ({
    medicineName: item.medicineName,
    genericName: item.genericName || null,
    dosage: item.dosage || null,
    frequency: item.frequency || null
  }))
  const fdaLabels = await fetchDrugLabels(medicines)
  if (!isAiConfigured() && fdaLabels.length === 0) {
    return {
      hasInteractions: false,
      severity: "none",
      warnings: [],
      allergyAlerts: [],
      configured: false
    }
  }
  const result = await runDrugInteractionCheck({
    medicines,
    allergies: allergies.map((a) => ({
      allergen: a.allergen,
      reaction: a.reaction,
      severity: a.severity
    })),
    fdaLabels
  })
  return { ...result, configured: isAiConfigured() }
}

export const scoreAppointmentNoShow = async (appointment) => {
  const stats = await getPatientNoShowStats(appointment.patient_id)
  return runNoShowPrediction({ appointment, stats })
}

export const emitSymptomSessionComplete = (session, patientUserId, parsed) => {
  if (!patientUserId) {
    return
  }
  emitToUser(patientUserId, "ai:symptom-complete", {
    sessionId: session.id,
    status: session.status,
    urgencyLevel: session.urgency_level,
    suggestedDepartment: session.suggested_department,
    reply: parsed.aiResponse || parsed.reply
  })
}
