import { Router } from "express";
import { authenticateUser } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { updateProfileSchema } from "./profile.validator.js";
import {
    getProfileController,
    updateProfileController,
    deleteProfileController,
} from "./profile.controller.js";

const profileRouter = Router();

// GET /profile 
profileRouter.get(
    "/",
    authenticateUser,
    catchAsync(getProfileController),
);

// PATCH /profile 
profileRouter.patch(
    "/",
    authenticateUser,
    validate(updateProfileSchema),
    catchAsync(updateProfileController),
);

// DELETE /profile 
profileRouter.delete(
    "/",
    authenticateUser,
    catchAsync(deleteProfileController),
);

export default profileRouter;