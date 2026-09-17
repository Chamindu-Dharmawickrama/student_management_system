import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged, requireRole } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { idParamSchema } from "../../utils/idParam.js";
import { createGradeBandSchema, updateGradeBandSchema, listGradeBandsQuerySchema } from "./gradeBand.validator.js";
import {
    createGradeBandController,
    listGradeBandsController,
    getGradeBandController,
    updateGradeBandController,
    deleteGradeBandController,
} from "./gradeBand.controller.js";

const gradeBandRouter = Router();

// Master grading configuration — mutations are admin-only (§2/§49). Reads
// are open to any authenticated role: the band table (grade/min/max/point/
// isPassing/description — nothing sensitive) is what teachers need to show
// a live grade preview while entering marks, and what students need to
// make sense of a grade letter on their own report card.
const adminOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN")];
const anyAuth = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN", "TEACHER", "STUDENT")];

gradeBandRouter.post("/", ...adminOnly, validate(createGradeBandSchema), catchAsync(createGradeBandController));

gradeBandRouter.get("/", ...anyAuth, validate(listGradeBandsQuerySchema), catchAsync(listGradeBandsController));

gradeBandRouter.get("/:id", ...anyAuth, validate(idParamSchema), catchAsync(getGradeBandController));

gradeBandRouter.patch(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    validate(updateGradeBandSchema),
    catchAsync(updateGradeBandController),
);

gradeBandRouter.delete("/:id", ...adminOnly, validate(idParamSchema), catchAsync(deleteGradeBandController));

export default gradeBandRouter;
