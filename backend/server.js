const express = require("express");
const cors = require("cors");
const mariadb = require("mariadb");

const app = express();
app.use(cors());
app.use(express.json());

// DB connection pool
const pool = mariadb.createPool({
    host: "localhost",
    user: "root",
    password: "password",
    database: "testdb",
    connectionLimit: 5
});

// Test route
app.get("/api/users", async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM users");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
