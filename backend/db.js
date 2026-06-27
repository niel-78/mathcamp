import mysql from "mysql2/promise";

const db = mysql.createPool({
    host: "localhost",
    user: "appuser",
    password: "secure123",
    database: "mydb"
});

export default db;
