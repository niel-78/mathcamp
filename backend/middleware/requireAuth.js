import db from "../db.js";

const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                error: "No token"
            });
        }

        const [rows] = await db.query(`
            SELECT u.*
            FROM user_sessions us
            INNER JOIN users u
                ON u.id = us.user_id
            WHERE us.session_token = ?
            LIMIT 1
        `, [token]);

        if (rows.length === 0) {
            return res.status(401).json({
                error: "Invalid token"
            });
        }

        req.user = rows[0];

        next();

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

export default requireAuth;
