import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import { listMarkSheetsQuerySchema, rejectMarkSheetSchema } from "./markSheet.validator.js";
import {
    listMarkSheetsController,
    getMarkSheetController,
    submitMarkSheetController,
    approveMarkSheetController,
    rejectMarkSheetController,
    lockMarkSheetController,
} from "./markSheet.controller.js";

const markSheetRouter = Router();

const anyAuth = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN", "TEACHER")];
const teacherOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("TEACHER")];
const adminOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN")];

// GET /marksheets — teacher: own scope only; admin: all
markSheetRouter.get("/", ...anyAuth, validate(listMarkSheetsQuerySchema), catchAsync(listMarkSheetsController));

// GET /marksheets/:id
markSheetRouter.get("/:id", ...anyAuth, validate(idParamSchema), catchAsync(getMarkSheetController));

// POST /marksheets/:id/submit — DRAFT/REJECTED -> SUBMITTED (teacher, own only)
markSheetRouter.post("/:id/submit", ...teacherOnly, validate(idParamSchema), catchAsync(submitMarkSheetController));

// POST /marksheets/:id/approve — SUBMITTED -> APPROVED (admin)
markSheetRouter.post("/:id/approve", ...adminOnly, validate(idParamSchema), catchAsync(approveMarkSheetController));

// POST /marksheets/:id/reject — SUBMITTED -> REJECTED (admin)
markSheetRouter.post(
    "/:id/reject",
    ...adminOnly,
    validate(idParamSchema),
    validate(rejectMarkSheetSchema),
    catchAsync(rejectMarkSheetController),
);

// POST /marksheets/:id/lock — APPROVED -> LOCKED (admin)
markSheetRouter.post("/:id/lock", ...adminOnly, validate(idParamSchema), catchAsync(lockMarkSheetController));

export default markSheetRouter;
