import { getPrisma } from "../../config/database.js";

const PROFILE_SELECT = {
    id: true,
    username: true,
    email: true,
    role: true,
    avatarUrl: true,
    authProvider: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};

// Fetch a user's profile fields by their ID
export const findUserById = async (userId) => {
    const db = getPrisma();
    return db.user.findUnique({
        where: { id: userId },
        select: PROFILE_SELECT,
    });
};

// Update allowed profile fields for a user
export const updateUserById = async (userId, data) => {
    const db = getPrisma();
    return db.user.update({
        where: { id: userId },
        data,
        select: PROFILE_SELECT,
    });
};

// delete user profile 
export const deleteUserById = async (userId) => {
    const db = getPrisma();
    return db.user.delete({
        where: { id: userId },
    });
};