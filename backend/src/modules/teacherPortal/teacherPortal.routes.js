import { Router } from "express";
import redis from "../../config/redis.js";
import logger from "../../config/logger.js";
import { createRateLimiter } from "../../middlewares/rateLimiter.js";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import { listMyStudentsQuerySchema } from "./teacherPortal.validator.js";
import { createMarkSchema, updateMarkSchema, teacherMarksQuerySchema, bulkMarksSchema } from "../marks/marks.validator.js";
import {
    getMyProfileController,
    getMyClassesController,
    getMyStudentsController,
    listMyMarksController,
    createMarkController,
    bulkCreateMarksController,
    updateMarkController,
} from "./teacherPortal.controller.js";

const teacherPortalRouter = Router();

// Self-service, scoped strictly to the authenticated teacher's own
// relationships (§31/§44) — never an admin route, never id-in-path.
const teacherOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("TEACHER")];

const bulkMarksLimiter = createRateLimiter({
    redis,
    limit: 30,
    windowMs: 60_000,
    prefix: "bulk-marks",
    errorMessage: "Too many bulk submissions. Try again later.",
    keyGenerator: (req) => req.user?.id ?? req.ip,
    fallbackBehavior: "block",
    onRedisError: (error) => {
        logger.warn(
            "Bulk-marks rate limiter Redis error - blocking request for safety",
            { message: error.message },
        );
    },
});

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

// POST /teacher/marks/bulk — registered before POST /marks/:id-shaped routes
// for readability; Express matches literal segments before params so order
// doesn't actually matter here, but this keeps the two POSTs adjacent.
teacherPortalRouter.post(
    "/marks/bulk",
    ...teacherOnly,
    bulkMarksLimiter,
    validate(bulkMarksSchema),
    catchAsync(bulkCreateMarksController),
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
