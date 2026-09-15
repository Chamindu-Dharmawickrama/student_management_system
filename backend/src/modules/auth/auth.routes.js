import { Router } from "express";
import redis from "../../config/redis.js";
import { createRateLimiter } from "../../middlewares/rateLimiter.js";
import logger from "../../config/logger.js";
import { validate } from "../../middlewares/validate.js";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema } from "./auth.validator.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { changePasswordController, forgotPasswordController, loginController, logoutAllController, logoutController, refreshController, resetPasswordController } from "./auth.controller.js";
import { authenticateUser } from "../../middlewares/authenticate.js";

const authRouter = Router();

const loginLimiter = createRateLimiter({
    redis,
    limit: 5,
    windowMs: 60_000,
    prefix: "login",
    errorMessage: "Too many login attempts. Try again later.",
    keyGenerator: (req) => req.user?.id ?? req.ip,
    fallbackBehavior: "block",
    onRedisError: (error) => {
        logger.warn(
            "Login rate limiter Redis error - blocking request for safety",
            {
                message: error.message,
            },
        );
    },
});

const refreshLimiter = createRateLimiter({
    redis,
    limit: 10,
    windowMs: 60_000,
    prefix: "refresh",
    errorMessage: "Too many token refresh attempts. Try again later.",
    keyGenerator: (req) => req.user?.id ?? req.ip,
    fallbackBehavior: "block",
    onRedisError: (error) => {
        logger.warn(
            "Refresh rate limiter Redis error - blocking request for safety",
            {
                message: error.message,
            },
        );
    },
});

const changePasswordLimiter = createRateLimiter({
    redis,
    limit: 5,
    windowMs: 60_000,
    prefix: "change-pw",
    errorMessage: "Too many password change attempts. Try again later.",
    keyGenerator: (req) => req.user?.id ?? req.ip,
    fallbackBehavior: "block",
    onRedisError: (error) => {
        logger.warn(
            "Change-password rate limiter Redis error - blocking request for safety",
            {
                message: error.message,
            },
        );
    },
});

const logoutLimiter = createRateLimiter({
    redis,
    limit: 20,
    windowMs: 60_000,
    prefix: "logout",
    errorMessage: "Too many logout attempts. Try again later.",
    keyGenerator: (req) => req.user?.id ?? req.ip,
    fallbackBehavior: "block",
    onRedisError: (error) => {
        logger.warn(
            "Logout rate limiter Redis error - blocking request for safety",
            {
                message: error.message,
            },
        );
    },
});

const logoutAllLimiter = createRateLimiter({
    redis,
    limit: 5,
    windowMs: 60_000,
    prefix: 'logout-all',
    errorMessage: 'Too many logout-all attempts. Try again later.',
    // req.user is populated by authenticateUser, which runs before this limiter
    keyGenerator: (req) => req.user?.id ?? req.ip,
    fallbackBehavior: 'block',
    onRedisError: (error) =>
        logger.warn('Logout-all rate limiter Redis error — blocking for safety', { message: error.message }),
});

const forgotPasswordLimiter = createRateLimiter({
    redis,
    limit: 3,
    windowMs: 15 * 60 * 1000,
    prefix: 'forgot-pw',
    errorMessage: 'Too many password reset requests. Please try again later.',
    keyGenerator: (req) => req.body?.email ?? req.ip,
    fallbackBehavior: 'block',
    onRedisError: (error) =>
        logger.warn('Forgot-password rate limiter Redis error — blocking for safety', { message: error.message }),
});

const resetPasswordLimiter = createRateLimiter({
    redis,
    limit: 5,
    windowMs: 15 * 60 * 1000,
    prefix: 'reset-pw',
    errorMessage: 'Too many password reset attempts. Please try again later.',
    keyGenerator: (req) => req.ip,
    fallbackBehavior: 'block',
    onRedisError: (error) =>
        logger.warn('Reset-password rate limiter Redis error — blocking for safety', { message: error.message }),
});



// POST /auth/login
authRouter.post("/login", loginLimiter, validate(loginSchema), catchAsync(loginController));

// POST /auth/refresh
authRouter.post("/refresh", refreshLimiter, catchAsync(refreshController));

// POST /auth/logout
authRouter.post("/logout", logoutLimiter, catchAsync(logoutController));

// POST /auth/logout-all  — requires a valid access token
authRouter.post('/logout-all',
    authenticateUser,
    logoutAllLimiter,
    catchAsync(logoutAllController),
);

// POST /auth/forgot-password  
authRouter.post('/forgot-password',
    forgotPasswordLimiter,
    validate(forgotPasswordSchema),
    catchAsync(forgotPasswordController),
);

// POST /auth/reset-password
authRouter.post('/reset-password',
    resetPasswordLimiter,
    validate(resetPasswordSchema),
    catchAsync(resetPasswordController),
);

// POST /auth/change-password — requires a valid access token only; deliberately
// NOT gated by requirePasswordAlreadyChanged, since this is how a
// mustChangePassword=true account (first login) escapes that state.
authRouter.post('/change-password',
    authenticateUser,
    changePasswordLimiter,
    validate(changePasswordSchema),
    catchAsync(changePasswordController),
);



export default authRouter;