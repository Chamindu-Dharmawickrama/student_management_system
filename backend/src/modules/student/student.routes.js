import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import {
    createStudentSchema,
    listStudentsQuerySchema,
    updateStudentSchema,
    listSubjectSelectionsQuerySchema,
    setSubjectSelectionsSchema,
} from "./student.validator.js";
import {
    createStudentController,
    listStudentsController,
    getStudentController,
    updateStudentController,
    deleteStudentController,
    listSubjectSelectionsController,
    setSubjectSelectionsController,
} from "./student.controller.js";

const studentRouter = Router();

// Every route on this router is admin-only account/record management
// (§2/§23) — the backend enforces this regardless of what the frontend sends.
const adminOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN")];

// POST /students — registration + account provisioning.
studentRouter.post(
    "/",
    ...adminOnly,
    validate(createStudentSchema),
    catchAsync(createStudentController),
);

// GET /students — admin dashboard list (paginated/filterable).
studentRouter.get(
    "/",
    ...adminOnly,
    validate(listStudentsQuerySchema),
    catchAsync(listStudentsController),
);

// GET /students/:id — admin "view student" detail.
studentRouter.get(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    catchAsync(getStudentController),
);

// PATCH /students/:id — admin edit.
studentRouter.patch(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    validate(updateStudentSchema),
    catchAsync(updateStudentController),
);

// DELETE /students/:id — admin deactivation (soft delete, §20/§21).
studentRouter.delete(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    catchAsync(deleteStudentController),
);

// GET /students/:id/subject-selections — the authoritative eligibility
// source MarkSheet generation reads (§9).
studentRouter.get(
    "/:id/subject-selections",
    ...adminOnly,
    validate(idParamSchema),
    validate(listSubjectSelectionsQuerySchema),
    catchAsync(listSubjectSelectionsController),
);

// PUT /students/:id/subject-selections — replaces the active set for one
// academic year (diff-synced, not appended).
studentRouter.put(
    "/:id/subject-selections",
    ...adminOnly,
    validate(idParamSchema),
    validate(setSubjectSelectionsSchema),
    catchAsync(setSubjectSelectionsController),
);

export default studentRouter;
