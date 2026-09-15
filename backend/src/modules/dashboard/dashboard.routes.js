import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { adminDashboardQuerySchema } from "./dashboard.validator.js";
import { getAdminDashboardController, getTeacherDashboardController, getStudentDashboardController } from "./dashboard.controller.js";

const dashboardRouter = Router();

// GET /dashboard/admin?academicYearId=
dashboardRouter.get(
    "/admin",
    authenticateUser,
    requirePasswordAlreadyChanged,
    requireRole("SCHOOL_ADMIN"),
    validate(adminDashboardQuerySchema),
    catchAsync(getAdminDashboardController),
);

// GET /dashboard/teacher
dashboardRouter.get(
    "/teacher",
    authenticateUser,
    requirePasswordAlreadyChanged,
    requireRole("TEACHER"),
    catchAsync(getTeacherDashboardController),
);

// GET /dashboard/student
dashboardRouter.get(
    "/student",
    authenticateUser,
    requirePasswordAlreadyChanged,
    requireRole("STUDENT"),
    catchAsync(getStudentDashboardController),
);

export default dashboardRouter;
