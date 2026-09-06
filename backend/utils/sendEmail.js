import nodemailer from "nodemailer";

// Skapa en transporter med One.coms SMTP-inställningar
const transporter = nodemailer.createTransport({
    host: "mailout.one.com",
    port: 587, // eller 465 för SSL/TLS
    secure: false, // true om port 465 används, false vid port 587 (använder STARTTLS)
    auth: {
        user: "beep-beep@mathcamp.one", // Måste vara en riktig e-post hos One.com
        pass: "vBRDLw,4Kp87tMV"       // Lösenordet till den e-postadressen
    }
});

// Funktion för att skicka mail
export const sendEmail = async (to, subject, textHtmlContent) => {
    try {
        console.log(`Försöker skicka mail till: ${to} via mailout.one.com...`);
        const info = await transporter.sendMail({
            from: '"mathcamp" <beep-beep@mathcamp.one>', // Måste matcha din domän/user
            to: to,
            subject: subject,
            text: textHtmlContent, // Alternativt HTML om du föredrar det
        });
        console.log("E-post skickad framgångsrikt! MessageId:", info.messageId);
        console.log("E-post skickad: %s", info.messageId);
        return { success: true };
    } catch (error) {
        console.error("Fel vid skickande av e-post:", error);
        return { success: false, error: error.message };
    }
};