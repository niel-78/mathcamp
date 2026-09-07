import "dotenv/config";
import nodemailer from "nodemailer";

const getSmtpConfig = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM;

    if (!host || !user || !pass || !from) {
        throw new Error(
            "SMTP-konfiguration saknas. Ange SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS och EMAIL_FROM i miljön."
        );
    }

    return {
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        from
    };
};

export const sendEmail = async (to, subject, textHtmlContent) => {
    try {
        const { host, port, secure, auth, from } = getSmtpConfig();
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth
        });

        console.log(`Försöker skicka mail till: ${to} via ${host}:${port}...`);
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            text: textHtmlContent
        });

        console.log("E-post skickad framgångsrikt! MessageId:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Fel vid skickande av e-post:", error);
        throw error;
    }
};