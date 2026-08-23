import "dotenv/config";
import mysql from "mysql2/promise";

try {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log("CONNECTED");
  await connection.end();
} catch (err) {
  console.error(err);
}
