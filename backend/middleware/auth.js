import db from "../db.js";

const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        console.log("👉 requireAuth start");

        if (!token) {
            console.log("👉 token:", token);
            return res.status(401).json({ error: "No token" });
        }

        const [rows] = await db.query(
            "SELECT * FROM users WHERE session_token = ?",
            [token]
        );

        console.log("👉 db result:", rows);

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid token" });
        }

        // ✅ sätt user på request
        req.user = rows[0];

        console.log("✅ user hittad:", req.user);

        next();
    } catch (err) {
        console.error("❌ AUTH ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

export default requireAuth;