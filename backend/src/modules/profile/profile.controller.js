import { sendSuccess } from "../../utils/apiResponse.js";
import {
    getProfileService,
    updateProfileService,
    deleteProfileService,
} from "./profile.service.js";

// GET /profile
export const getProfileController = async (req, res) => {
    const { id: userId } = req.user;

    const profile = await getProfileService({ userId });

    return sendSuccess(res, {
        statusCode: 200,
        message: "Profile retrieved successfully.",
        data: profile,
    });
};

// PATCH /profile
export const updateProfileController = async (req, res) => {
    const { id: userId } = req.user;

    const profile = await updateProfileService({ userId, data: req.body });

    return sendSuccess(res, {
        statusCode: 200,
        message: "Profile updated successfully.",
        data: profile,
    });
};

// DELETE /profile
export const deleteProfileController = async (req, res) => {
    const { id: userId } = req.user;
    // req.accessToken is set by the authenticateUser middleware
    const accessToken = req.accessToken;

    await deleteProfileService({ userId, accessToken });

    return sendSuccess(res, {
        statusCode: 200,
        message: "Account deleted successfully.",
        data: null,
    });
};
