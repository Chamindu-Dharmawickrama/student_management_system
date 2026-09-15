import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import { listMyStudentsQuerySchema } from "./teacherPortal.validator.js";
import { createMarkSchema, updateMarkSchema, teacherMarksQuerySchema } from "../marks/marks.validator.js";
import {
    getMyProfileController,
    getMyClassesController,
    getMyStudentsController,
    listMyMarksController,
    createMarkController,
    updateMarkController,
} from "./teacherPortal.controller.js";

const teacherPortalRouter = Router();

// Self-service, scoped strictly to the authenticated teacher's own
// relationships (§31/§44) — never an admin route, never id-in-path.
const teacherOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("TEACHER")];

// GET /teacher/me
teacherPortalRouter.get("/me", ...teacherOnly, catchAsync(getMyProfileController));

// GET /teacher/classes
teacherPortalRouter.get("/classes", ...teacherOnly, catchAsync(getMyClassesController));

// GET /teacher/students
teacherPortalRouter.get(
    "/students",
    ...teacherOnly,
    validate(listMyStudentsQuerySchema),
    catchAsync(getMyStudentsController),
);

// GET /teacher/marks
teacherPortalRouter.get(
    "/marks",
    ...teacherOnly,
    validate(teacherMarksQuerySchema),
    catchAsync(listMyMarksController),
);

// POST /teacher/marks
teacherPortalRouter.post(
    "/marks",
    ...teacherOnly,
    validate(createMarkSchema),
    catchAsync(createMarkController),
);

// PATCH /teacher/marks/:id
teacherPortalRouter.patch(
    "/marks/:id",
    ...teacherOnly,
    validate(idParamSchema),
    validate(updateMarkSchema),
    catchAsync(updateMarkController),
);

export default teacherPortalRouter;
