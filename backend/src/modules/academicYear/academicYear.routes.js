import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import {
    createAcademicYearSchema,
    updateAcademicYearSchema,
    listAcademicYearsQuerySchema,
    termIdParamSchema,
    updateTermSchema,
} from "./academicYear.validator.js";
import {
    createAcademicYearController,
    listAcademicYearsController,
    getAcademicYearController,
    updateAcademicYearController,
    listTermsController,
    getTermController,
    updateTermController,
} from "./academicYear.controller.js";

const academicYearRouter = Router();

// Master academic-calendar data — admin-only (§2/§49).
const adminOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN")];

academicYearRouter.post("/", ...adminOnly, validate(createAcademicYearSchema), catchAsync(createAcademicYearController));

academicYearRouter.get("/", ...adminOnly, validate(listAcademicYearsQuerySchema), catchAsync(listAcademicYearsController));

academicYearRouter.get("/:id", ...adminOnly, validate(idParamSchema), catchAsync(getAcademicYearController));

academicYearRouter.patch(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    validate(updateAcademicYearSchema),
    catchAsync(updateAcademicYearController),
);

// Terms — always auto-created with their year; only name/dates are editable.
academicYearRouter.get("/:id/terms", ...adminOnly, validate(idParamSchema), catchAsync(listTermsController));

academicYearRouter.get(
    "/:id/terms/:termId",
    ...adminOnly,
    validate(termIdParamSchema),
    catchAsync(getTermController),
);

academicYearRouter.patch(
    "/:id/terms/:termId",
    ...adminOnly,
    validate(termIdParamSchema),
    validate(updateTermSchema),
    catchAsync(updateTermController),
);

export default academicYearRouter;
