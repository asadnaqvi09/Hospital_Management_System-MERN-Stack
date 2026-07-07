import { Router } from "express"
import { authenticate } from "../../shared/middlewares/authenticate.js"
import { requireRole } from "../../shared/middlewares/requireRole.js"
import { validate } from "../../shared/middlewares/validate.js"
import { ROLES } from "../../shared/constants/roles.js"
import {
  createRoomSchema,
  roomIdSchema,
  updateRoomSchema,
  listRoomsSchema,
  createAdmissionSchema,
  admissionIdSchema,
  listAdmissionsSchema,
  addNursingNoteSchema,
  dischargeAdmissionSchema
} from "./ipd.validator.js"
import {
  createRoom,
  getRooms,
  updateRoomHandler,
  admitPatient,
  getAdmissions,
  getAdmission,
  addNursingNoteHandler,
  getNursingNotes,
  dischargePatient
} from "./ipd.controller.js"

export const ipdRouter = Router()

ipdRouter.use(authenticate)

ipdRouter.post("/rooms", requireRole(ROLES.ADMIN), validate(createRoomSchema), createRoom)
ipdRouter.get(
  "/rooms",
  requireRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ADMIN),
  validate(listRoomsSchema),
  getRooms
)
ipdRouter.patch("/rooms/:roomId", requireRole(ROLES.ADMIN), validate(updateRoomSchema), updateRoomHandler)

ipdRouter.post(
  "/admissions",
  requireRole(ROLES.DOCTOR, ROLES.RECEPTIONIST),
  validate(createAdmissionSchema),
  admitPatient
)
ipdRouter.get(
  "/admissions",
  requireRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN, ROLES.PATIENT),
  validate(listAdmissionsSchema),
  getAdmissions
)
ipdRouter.get(
  "/admissions/:admissionId",
  requireRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN, ROLES.PATIENT),
  validate(admissionIdSchema),
  getAdmission
)
ipdRouter.post(
  "/admissions/:admissionId/notes",
  requireRole(ROLES.NURSE),
  validate(addNursingNoteSchema),
  addNursingNoteHandler
)
ipdRouter.get(
  "/admissions/:admissionId/notes",
  requireRole(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN),
  validate(admissionIdSchema),
  getNursingNotes
)
ipdRouter.patch(
  "/admissions/:admissionId/discharge",
  requireRole(ROLES.DOCTOR),
  validate(dischargeAdmissionSchema),
  dischargePatient
)
