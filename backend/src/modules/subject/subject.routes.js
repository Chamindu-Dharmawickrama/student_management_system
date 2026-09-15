import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import { createSubjectSchema, updateSubjectSchema, listSubjectsQuerySchema } from "./subject.validator.js";
import {
    createSubjectController,
    listSubjectsController,
    getSubjectController,
    updateSubjectController,
    deleteSubjectController,
} from "./subject.controller.js";

const subjectRouter = Router();

// Master-data management — admin-only (§2), same guard stack as
// /students and /teachers.
const adminOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN")];

subjectRouter.post("/", ...adminOnly, validate(createSubjectSchema), catchAsync(createSubjectController));

subjectRouter.get("/", ...adminOnly, validate(listSubjectsQuerySchema), catchAsync(listSubjectsController));

subjectRouter.get("/:id", ...adminOnly, validate(idParamSchema), catchAsync(getSubjectController));

subjectRouter.patch(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    validate(updateSubjectSchema),
    catchAsync(updateSubjectController),
);

subjectRouter.delete("/:id", ...adminOnly, validate(idParamSchema), catchAsync(deleteSubjectController));

export default subjectRouter;
