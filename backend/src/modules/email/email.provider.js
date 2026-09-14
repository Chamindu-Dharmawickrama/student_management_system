import nodemailer from 'nodemailer';
import { config } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { templateRegistry } from './email.templates.js';
import { EMAIL_TYPES } from './email.types.js';

// for developing stage to log email in console instead of sending it
export const consoleEmailProvider = {
    async send({ to, subject, html: _html, text }) {
        logger.info('[EmailProvider:console] Would send email', { to, subject });
        logger.debug(
            '[EmailProvider:console] Plain-text body:\n' + text,
        );
        return { providerId: null, status: 'sent' };
    },
};


// SMTP provider 
let _smtpTransporter = null;

function getSmtpTransporter() {
    if (!_smtpTransporter) {
        _smtpTransporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
            auth: {
                user: config.smtpUser,
                pass: config.smtpPass
            }
        });

        logger.info('[EmailProvider:smtp] SMTP transporter created', {
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpSecure,
        });

    }
    return _smtpTransporter;
}

export const smtpEmailProvider = {
    async send({ to, subject, html, text }) {
        const transporter = getSmtpTransporter();

        const info = await transporter.sendMail({
            from: `"${config.emailFromName}" <${config.emailFromAddress}>`,
            to,
            subject,
            html,
            text,
        });

        logger.info('[EmailProvider:smtp] Email sent', {
            to,
            subject,
            messageId: info.messageId,
        });

        return { providerId: info.messageId ?? null, status: 'sent' };
    }
}

// return the provider based on environment - factory function
export const getEmailProvider = () => {
    switch (config.emailProvider) {
        case 'smtp':
            return smtpEmailProvider;
        case 'console':
        default:
            return consoleEmailProvider;
    }
};

// test email sending function
// export const sendTestEmail = async () => {
//     try {
//         const provider = getEmailProvider();

//         await provider.send({
//             to: "chamindudharmawickrema@gmail.com",
//             subject: 'Test email',
//             html: `<h1>Test email from NoteVault ${new Date().toISOString()}</h1>`,
//             text: 'This is a test email',
//         });

//         logger.info('[EmailProvider:test] Test email sent ');
//     } catch (error) {
//         logger.error('[EmailProvider:test] Failed to send test email', { error });
//     }
// };

export const sendTestEmail = async () => {
    try {
        const provider = getEmailProvider();

        const registerTemp = templateRegistry[EMAIL_TYPES.REGISTRATION_CONFIRMATION];
        const renderData = registerTemp.render({
            username: "Chamindu",
            email: "chamindudharmawickrema@gmail.com",

        })

        await provider.send({
            to: "chamindudharmawickrema@gmail.com",
            subject: renderData.subject,
            html: renderData.html,
            text: renderData.text,
        });

        logger.info('[EmailProvider:test] Test email sent ');
    } catch (error) {
        logger.error('[EmailProvider:test] Failed to send test email', { error });
    }
};

// sendTestEmail();
// run : node src/modules/email/email.provider.js