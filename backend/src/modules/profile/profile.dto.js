export const toProfileDTO = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    authProvider: user.authProvider ?? "local",
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
