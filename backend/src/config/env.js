import "dotenv/config";

const parseInteger = (value, fallback) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const parseFloatValue = (value, fallback) => {
    const parsed = Number.parseFloat(value ?? "");
    return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (value, fallback) => {
    if (value === undefined || value === null) {
        return fallback;
    }

    const normalized = String(value).trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
    return fallback;
};

const parseAllowedOrigins = (value) =>
    value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

const nodeEnv = process.env.NODE_ENV ?? "development";

if (nodeEnv === "production") {
    const requiredKeys = [
        "DATABASE_URL",
        "ALLOWED_ORIGINS",
        "REDIS_URL",
    ];
    for (const key of requiredKeys) {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
    }
}

export const config = Object.freeze({
    nodeEnv,
    port: parseInteger(process.env.PORT, 8000),
    databaseUrl: process.env.DATABASE_URL ?? "",
    allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS ?? ""),

    gracefulShutdownTimeoutMs: parseInteger(
        process.env.GRACEFUL_SHUTDOWN_TIMEOUT_MS,
        15_000,
    ),

    redisUrl: process.env.REDIS_URL ?? "",
    rateLimitMaxRequests: parseInteger(
        process.env.RATE_LIMIT_MAX_REQUESTS,
        100,
    ),
    rateLimitWindowMs: parseInteger(
        process.env.RATE_LIMIT_WINDOW_MS,
        15 * 60 * 1000,
    ),

    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? "",
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY ?? "15m",
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET ?? "",
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY ?? "7d",
    refreshTokenExpiryInMs: parseInteger(process.env.REFRESH_TOKEN_EXPIRY_MS, 7 * 24 * 60 * 60 * 1000),

    maxLoginAttempts: parseInteger(process.env.MAX_LOGIN_ATTEMPTS, 3),
    lockoutDurationMs: parseInteger(process.env.LOCKOUT_DURATION_MS, 15 * 60 * 1000),

    // 15 * 60 * 1000 = 1.5min 
    passwordResetExpiryInMs: parseInteger(process.env.PASSWORD_RESET_EXPIRY_MS, 900000),

    emailProvider: process.env.EMAIL_PROVIDER ?? 'console',
    emailFromAddress: process.env.EMAIL_FROM_ADDRESS ?? 'noreply@example.com',
    emailFromName: process.env.EMAIL_FROM_NAME ?? 'NoteVault',

    smtpHost: process.env.SMTP_HOST ?? '',
    smtpPort: parseInteger(process.env.SMTP_PORT, 587),
    smtpSecure: parseBoolean(process.env.SMTP_SECURE, false),
    smtpUser: process.env.SMTP_USER ?? '',
    smtpPass: process.env.SMTP_PASS ?? '',

    emailWorkerPollMs: parseInteger(process.env.EMAIL_WORKER_POLL_MS, 5_000), // 5 seconds
    emailWorkerMaxAttempts: parseInteger(process.env.EMAIL_WORKER_MAX_ATTEMPTS, 5),
    emailWorkerStuckJobTimeoutMs: parseInteger(
        process.env.EMAIL_WORKER_STUCK_JOB_TIMEOUT_MS,
        5 * 60 * 1000,  // 5 minutes
    ),


    logLevel: process.env.LOG_LEVEL ?? (nodeEnv === "production" ? "info" : "debug"),

    // Used only by prisma/seed.js to bootstrap the first SCHOOL_ADMIN account
    // (there is no public self-registration — §23/§35). No defaults for
    // credentials: the seed script requires these explicitly.
    seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "",
    seedAdminUsername: process.env.SEED_ADMIN_USERNAME ?? "",
    seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "",
    seedAdminFirstName: process.env.SEED_ADMIN_FIRST_NAME ?? "Admin",
    seedAdminLastName: process.env.SEED_ADMIN_LAST_NAME ?? "User",
});