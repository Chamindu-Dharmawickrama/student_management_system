import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import { createClassSchema, updateClassSchema, listClassesQuerySchema } from "./class.validator.js";
import {
    createClassController,
    listClassesController,
    getClassController,
    updateClassController,
    deleteClassController,
} from "./class.controller.js";

const classRouter = Router();

// Master-data management — admin-only (§2), same guard stack as
// /students and /teachers.
const adminOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN")];

classRouter.post("/", ...adminOnly, validate(createClassSchema), catchAsync(createClassController));

classRouter.get("/", ...adminOnly, validate(listClassesQuerySchema), catchAsync(listClassesController));

classRouter.get("/:id", ...adminOnly, validate(idParamSchema), catchAsync(getClassController));

classRouter.patch(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    validate(updateClassSchema),
    catchAsync(updateClassController),
);

classRouter.delete("/:id", ...adminOnly, validate(idParamSchema), catchAsync(deleteClassController));

export default classRouter;
