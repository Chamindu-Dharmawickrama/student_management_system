import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import { createTeacherSchema, listTeachersQuerySchema, updateTeacherSchema } from "./teacher.validator.js";
import {
    createTeacherController,
    listTeachersController,
    getTeacherController,
    updateTeacherController,
    deleteTeacherController,
} from "./teacher.controller.js";

const teacherRouter = Router();

// Every route on this router is admin-only account/record management
// (§2/§23) — the backend enforces this regardless of what the frontend sends.
const adminOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN")];

// POST /teachers — registration + account provisioning.
teacherRouter.post(
    "/",
    ...adminOnly,
    validate(createTeacherSchema),
    catchAsync(createTeacherController),
);

// GET /teachers — admin dashboard list (paginated/filterable).
teacherRouter.get(
    "/",
    ...adminOnly,
    validate(listTeachersQuerySchema),
    catchAsync(listTeachersController),
);

// GET /teachers/:id — admin "view teacher" detail.
teacherRouter.get(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    catchAsync(getTeacherController),
);

// PATCH /teachers/:id — admin edit.
teacherRouter.patch(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    validate(updateTeacherSchema),
    catchAsync(updateTeacherController),
);

// DELETE /teachers/:id — admin deactivation (soft delete, §22/§23).
teacherRouter.delete(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    catchAsync(deleteTeacherController),
);

export default teacherRouter;
