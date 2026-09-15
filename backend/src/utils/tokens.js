import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';

// signs a new access token containing the user info
export const signAccessToken = (user) => {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role,
            // Embedded so authenticateUser can enforce the first-login
            // password-change restriction without a DB round trip per
            // request. Re-signed on every login/refresh/password-change, so
            // it always reflects the current state (see auth.service.js).
            mustChangePassword: user.mustChangePassword ?? false,
        },
        config.accessTokenSecret,
        { expiresIn: config.accessTokenExpiry }
    )
}

// signs a new refresh token containing the user's id and the token's DB family.
// the family allows us to group all rotations from the same login session.
export const signRefreshToken = (user, family) => {
    return jwt.sign(
        { sub: user.id, username: user.username, family },
        config.refreshTokenSecret,
        { expiresIn: config.refreshTokenExpiry }
    )
}

// verify access token 
export const verifyAccessToken = (token) => {
    return jwt.verify(token, config.accessTokenSecret)
}

// verify refresh token 
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.refreshTokenSecret)
}

// decode token
export const decodeToken = (token) => jwt.decode(token);

// hash the refresh token before storing it in the database
export function hashRefreshToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// hash access token before storing it in the blocklist
export const hashAccessToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
