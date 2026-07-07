import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { upload } from "../../shared/middlewares/upload.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  createPatientSchema,
  searchPatientsSchema,
  patientIdSchema,
  recordVitalsSchema,
  addAllergySchema,
  allergyIdSchema,
  addConditionSchema,
  updateConditionSchema,
  uploadDocumentSchema
} from "./patients.validator.js"
import {
  registerPatient,
  getPatients,
  getPatient,
  getPatientEmrTimeline,
  recordVitals,
  getVitals,
  addAllergy,
  getAllergies,
  removeAllergy,
  addCondition,
  getConditions,
  editCondition,
  uploadDocument,
  getDocuments
} from "./patients.controller.js"

export const patientsRouter = Router()

patientsRouter.use(authenticate)

patientsRouter.post(
  "/",
  requireRole(ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(createPatientSchema),
  registerPatient
)

patientsRouter.get(
  "/",
  requireRole(ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.NURSE),
  validate(searchPatientsSchema),
  getPatients
)

patientsRouter.get(
  "/:patientId",
  requireRole(ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.NURSE, ROLES.PATIENT),
  validate(patientIdSchema),
  getPatient
)

patientsRouter.get(
  "/:patientId/emr",
  requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.PATIENT),
  validate(patientIdSchema),
  getPatientEmrTimeline
)

patientsRouter.post(
  "/:patientId/vitals",
  requireRole(ROLES.DOCTOR, ROLES.NURSE),
  validate(recordVitalsSchema),
  recordVitals
)

patientsRouter.get(
  "/:patientId/vitals",
  requireRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN, ROLES.PATIENT),
  validate(patientIdSchema),
  getVitals
)

patientsRouter.post(
  "/:patientId/allergies",
  requireRole(ROLES.DOCTOR),
  validate(addAllergySchema),
  addAllergy
)

patientsRouter.get(
  "/:patientId/allergies",
  requireRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN, ROLES.PATIENT),
  validate(patientIdSchema),
  getAllergies
)

patientsRouter.delete(
  "/:patientId/allergies/:allergyId",
  requireRole(ROLES.DOCTOR),
  validate(allergyIdSchema),
  removeAllergy
)

patientsRouter.post(
  "/:patientId/conditions",
  requireRole(ROLES.DOCTOR),
  validate(addConditionSchema),
  addCondition
)

patientsRouter.get(
  "/:patientId/conditions",
  requireRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN, ROLES.PATIENT),
  validate(patientIdSchema),
  getConditions
)

patientsRouter.patch(
  "/:patientId/conditions/:conditionId",
  requireRole(ROLES.DOCTOR),
  validate(updateConditionSchema),
  editCondition
)

patientsRouter.post(
  "/:patientId/documents",
  requireRole(ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN),
  upload.single("file"),
  validate(uploadDocumentSchema),
  uploadDocument
)

patientsRouter.get(
  "/:patientId/documents",
  requireRole(ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.PATIENT),
  validate(patientIdSchema),
  getDocuments
)
