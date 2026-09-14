import { AppError } from "../../utils/appError.js";
import { findUserById, updateUserById, deleteUserById } from "./profile.repository.js";
import { toProfileDTO } from "./profile.dto.js";
import { addToBlocklist, setUserInvalidateBefore } from "../../utils/tokenBlocklist.js";
import { decodeToken } from "../../utils/tokens.js";

// get user profile 
export const getProfileService = async ({ userId }) => {

    const user = await findUserById(userId);

    if (!user) {
        throw new AppError("User not found.", 404);
    };

    return toProfileDTO(user);
};


// update user profile 
export const updateProfileService = async ({ userId, data }) => {

    // build safe update object 
    const updateData = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    let updatedUser;

    try {
        updatedUser = await updateUserById(userId, updateData);        
    } catch (err) {

        // P2002: Unique constraint violation (username or email already in use)
        if (err.code === "P2002") {
            const field = err.meta?.target?.[0] ?? "field";
            throw new AppError(`This ${field} is already in use.`, 409);
        };

        // P2025: The record to update was not found
        if (err.code === "P2025") {
            throw new AppError("User not found.", 404);
        };

        throw err;
    };

    return toProfileDTO(updatedUser);
};


// delete user profile 
export const deleteProfileService = async ({ userId, accessToken }) => {

    const user = await findUserById(userId);

    if (!user) {
        throw new AppError("User not found.", 404);
    };

    await deleteUserById(userId);

    // invalidate all outstanding access tokens for this userId via IAT check
    await setUserInvalidateBefore(userId);

    // blocklist the caller's current access token immediately
    await _blocklistCurrentAccessToken(accessToken);
};


async function _blocklistCurrentAccessToken(accessToken) {
    if (!accessToken) return;
    try {
        const payload = decodeToken(accessToken);
        if (!payload?.exp) return;
        const remainingMs = payload.exp * 1000 - Date.now();
        await addToBlocklist(accessToken, remainingMs);
    } catch {

    }
};