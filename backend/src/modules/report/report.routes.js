import { Router } from "express";
import redis from "../../config/redis.js";
import logger from "../../config/logger.js";
import { createRateLimiter } from "../../middlewares/rateLimiter.js";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { studentTermReportSchema, classExamReportSchema } from "./report.validator.js";
import { getStudentTermReportController, getClassExamReportController } from "./report.controller.js";

const reportRouter = Router();

const studentOrAdmin = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN", "STUDENT")];
const teacherOrAdmin = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN", "TEACHER")];

// Report generation (PDF/Excel rendering, DB writes) is comparatively
// expensive — rate-limited same as auth's sensitive endpoints.
const reportLimiter = createRateLimiter({
    redis,
    limit: 10,
    windowMs: 60_000,
    prefix: "report-gen",
    errorMessage: "Too many report generations. Try again later.",
    keyGenerator: (req) => req.user?.id ?? req.ip,
    fallbackBehavior: "block",
    onRedisError: (error) => {
        logger.warn("Report-generation rate limiter Redis error - blocking request for safety", { message: error.message });
    },
});

// GET /reports/student/:studentId/term/:termId?format=json|pdf|excel
reportRouter.get(
    "/student/:studentId/term/:termId",
    ...studentOrAdmin,
    reportLimiter,
    validate(studentTermReportSchema),
    catchAsync(getStudentTermReportController),
);

// GET /reports/class/:classId/exam/:examId?format=json|pdf|excel
reportRouter.get(
    "/class/:classId/exam/:examId",
    ...teacherOrAdmin,
    reportLimiter,
    validate(classExamReportSchema),
    catchAsync(getClassExamReportController),
);

export default reportRouter;
