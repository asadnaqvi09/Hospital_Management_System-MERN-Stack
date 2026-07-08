import { Worker } from "bullmq"
// import { jobConnection, QUEUE_NAMES } from "./queues.js"
import { QUEUE_NAMES } from "./queues.js"
import { logger } from "../utils/logger.js"
import {
  findSymptomSessionById,
  updateSymptomSession,
  listUpcomingAppointmentsForScoring,
  updateAppointmentNoShowProbability
} from "../../modules/ai/ai.model.js"
import { runSymptomTriage, emitSymptomSessionComplete, scoreAppointmentNoShow } from "../../modules/ai/ai.service.js"
import { findPatientById } from "../../modules/patients/patients.model.js"

const processSymptomTriage = async (sessionId) => {
  const session = await findSymptomSessionById(sessionId)
  if (!session) {
    throw new Error(`Symptom session ${sessionId} not found`)
  }

  await updateSymptomSession(sessionId, { status: "processing" })

  try {
    const messages = JSON.parse(session.symptoms_input)
    const result = await runSymptomTriage(messages)
    const storedResponse = JSON.stringify({
      reply: result.aiResponse,
      recommendations: result.recommendations
    })

    const updated = await updateSymptomSession(sessionId, {
      aiResponse: storedResponse,
      suggestedDepartment: result.suggestedDepartment,
      urgencyLevel: result.urgencyLevel,
      status: "completed"
    })

    const patient = await findPatientById(session.patient_id)
    emitSymptomSessionComplete(updated, patient?.user_id, result)

    return { sessionId, status: "completed" }
  } catch (error) {
    await updateSymptomSession(sessionId, {
      status: "failed",
      aiResponse: JSON.stringify({ error: error.message })
    })
    throw error
  }
}

const processNoShowBatch = async (daysAhead = 14) => {
  const appointments = await listUpcomingAppointmentsForScoring({ daysAhead })
  let scored = 0

  for (const appointment of appointments) {
    const prediction = await scoreAppointmentNoShow(appointment)
    await updateAppointmentNoShowProbability(appointment.id, prediction.probability)
    scored += 1
  }

  return { scored }
}

export const createAiWorker = () => {
  // Redis/BullMQ disabled — uncomment when Redis is available
  // const worker = new Worker(
  //   QUEUE_NAMES.AI,
  //   async (job) => {
  //     if (job.name === "symptom-triage") {
  //       return processSymptomTriage(job.data.sessionId)
  //     }
  //     if (job.name === "no-show-batch") {
  //       return processNoShowBatch(job.data.daysAhead)
  //     }
  //     return null
  //   },
  //   { connection: jobConnection }
  // )

  // worker.on("failed", (job, error) => {
  //   logger.error(`AI job ${job?.id} failed: ${error.message}`)
  // })

  // return worker
  logger.warn("AI worker disabled — Redis is not available")
  return null
}

// Suppress unused import warnings while worker is disabled
void Worker
void QUEUE_NAMES
void processSymptomTriage
void processNoShowBatch
