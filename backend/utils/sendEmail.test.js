import test from "node:test";
import assert from "node:assert/strict";
import { sendEmail } from "./sendEmail.js";

test("sendEmail requires SMTP configuration from environment", async () => {
    const originalEnv = { ...process.env };

    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM;

    await assert.rejects(
        () => sendEmail("test@example.com", "Test", "Hej"),
        /SMTP|EMAIL_FROM/
    );

    process.env = originalEnv;
});
