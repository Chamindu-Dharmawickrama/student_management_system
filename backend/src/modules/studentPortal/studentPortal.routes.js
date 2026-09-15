import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { studentMarksQuerySchema } from "../marks/marks.validator.js";
import { getMyProfileController, listMyMarksController } from "./studentPortal.controller.js";

const studentPortalRouter = Router();

// Self-service only, strictly scoped to the authenticated student's own
// record (§12/§15/§32) — read-only (§16), never an admin route.
const studentOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("STUDENT")];

// GET /student/me
studentPortalRouter.get("/me", ...studentOnly, catchAsync(getMyProfileController));

// GET /student/me/marks
studentPortalRouter.get(
    "/me/marks",
    ...studentOnly,
    validate(studentMarksQuerySchema),
    catchAsync(listMyMarksController),
);

export default studentPortalRouter;
