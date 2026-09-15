import { config } from '../../config/env.js';
import { EMAIL_TYPES } from './email.types.js';
import { templateRegistry } from './email.templates.js';
import { createEmailJob } from './email.repository.js';

// send the initial username + one-time password to a newly registered
// student/teacher (§18). Must be called inside the same transaction that
// creates the account so registration and the credential email job either
// both commit or both roll back (§20/§22).
export const sendInitialCredentials = async (user, temporaryPassword, role, tx) => {
    const template = templateRegistry[EMAIL_TYPES.INITIAL_CREDENTIALS];

    const payload = template.payloadSchema.parse({
        recipientName: `${user.firstName} ${user.lastName}`.trim(),
        username: user.username,
        temporaryPassword,
        role,
        loginUrl: `${config.allowedOrigins[0]}/login`,
    });

    await createEmailJob(tx, {
        type: EMAIL_TYPES.INITIAL_CREDENTIALS,
        recipient: user.email,
        payload,
    })
}


// send reset password email
export const sendPasswordReset = async (user, resetUrl, tx) => {
    const template = templateRegistry[EMAIL_TYPES.PASSWORD_RESET];

    const expiresInMinutes = Math.round(config.passwordResetExpiryInMs / 60_000);

    // validate the payload 
    const payload = template.payloadSchema.parse({
        username: user.username,
        email: user.email,
        resetUrl,
        expiresInMinutes,
    });

    // payload = { username: 'user1', email: '[EMAIL_ADDRESS]', resetUrl: "example-url", expiresInMinutes: 15 }
    await createEmailJob(tx, {
        type: EMAIL_TYPES.PASSWORD_RESET,
        recipient: user.email,
        payload,
    })

}