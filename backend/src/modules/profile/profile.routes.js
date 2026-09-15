import { Router } from "express";
import { authenticateUser, requirePasswordAlreadyChanged } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { updateProfileSchema } from "./profile.validator.js";
import {
    getProfileController,
    updateProfileController,
    deleteProfileController,
} from "./profile.controller.js";

const profileRouter = Router();

// GET /profile — allowed even before the mandatory password change so the
// frontend can render "who am I" while the change-password dialog is open.
profileRouter.get(
    "/",
    authenticateUser,
    catchAsync(getProfileController),
);

// PATCH /profile
profileRouter.patch(
    "/",
    authenticateUser,
    requirePasswordAlreadyChanged,
    validate(updateProfileSchema),
    catchAsync(updateProfileController),
);

// DELETE /profile
profileRouter.delete(
    "/",
    authenticateUser,
    requirePasswordAlreadyChanged,
    catchAsync(deleteProfileController),
);

export default profileRouter;