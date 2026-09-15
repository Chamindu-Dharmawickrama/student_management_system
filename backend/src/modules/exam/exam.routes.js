import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import { updateExamPeriodSchema } from "./exam.validator.js";
import { getExamController, updateExamPeriodController, generateMarkSheetsController } from "./exam.controller.js";

const examRouter = Router();

// Exams are never created/deleted directly — they're auto-provisioned with
// their Term (academicYear.routes.js). Admin-only (§2/§49).
const adminOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN")];

examRouter.get("/:id", ...adminOnly, validate(idParamSchema), catchAsync(getExamController));

// PATCH /exams/:id — sets the exam's date range, its only mutable attribute.
examRouter.patch(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    validate(updateExamPeriodSchema),
    catchAsync(updateExamPeriodController),
);

examRouter.post(
    "/:id/generate-marksheets",
    ...adminOnly,
    validate(idParamSchema),
    catchAsync(generateMarkSheetsController),
);

export default examRouter;
