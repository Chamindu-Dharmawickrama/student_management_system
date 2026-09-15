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

// Master grading configuration — admin-only (§2/§49).
const adminOnly = [authenticateUser, requirePasswordAlreadyChanged, requireRole("SCHOOL_ADMIN")];

gradeBandRouter.post("/", ...adminOnly, validate(createGradeBandSchema), catchAsync(createGradeBandController));

gradeBandRouter.get("/", ...adminOnly, validate(listGradeBandsQuerySchema), catchAsync(listGradeBandsController));

gradeBandRouter.get("/:id", ...adminOnly, validate(idParamSchema), catchAsync(getGradeBandController));

gradeBandRouter.patch(
    "/:id",
    ...adminOnly,
    validate(idParamSchema),
    validate(updateGradeBandSchema),
    catchAsync(updateGradeBandController),
);

gradeBandRouter.delete("/:id", ...adminOnly, validate(idParamSchema), catchAsync(deleteGradeBandController));

export default gradeBandRouter;
