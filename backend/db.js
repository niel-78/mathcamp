import mysql from "mysql2/promise";

const db = mysql.createPool({
    host: "db",
    user: "root",
    password: "password",
    database: "mydb"
});

export default db;
