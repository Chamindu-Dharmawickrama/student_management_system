import { config } from '../../config/env.js';
import { EMAIL_TYPES } from './email.types.js';
import { templateRegistry } from './email.templates.js';
import { createEmailJob } from './email.repository.js';

// send registration confirmation email
export const sendRegistrationConfirmation = async (user, tx) => {
    const template = templateRegistry[EMAIL_TYPES.REGISTRATION_CONFIRMATION];

    // validate the payload 
    const payload = template.payloadSchema.parse({
        username: user.username,
        email: user.email
    });

    // the payload = {username:"user1",email:"[EMAIL_ADDRESS]"}
    await createEmailJob(tx, {
        type: EMAIL_TYPES.REGISTRATION_CONFIRMATION,
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