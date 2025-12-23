const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransport = () => {
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
        logger.warn('SMTP not configured; mailer will not send emails');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
};

const sendMail = async ({ to, subject, html, text }) => {
    const transporter = createTransport();
    if (!transporter) {
        logger.info('Skipping sendMail to %s (no SMTP configured)', to);
        return;
    }

    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to,
        subject,
        html,
        text
    });

    logger.info('Email sent: %s', info.messageId);
    return info;
};

module.exports = { sendMail };
