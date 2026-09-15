// email types are available
export const EMAIL_TYPES = Object.freeze({
    PASSWORD_RESET: 'PASSWORD_RESET',
    // Sent when an admin registers a student or teacher — carries the
    // system-generated username + one-time password (§18).
    INITIAL_CREDENTIALS: 'INITIAL_CREDENTIALS',
});
