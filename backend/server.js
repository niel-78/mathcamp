import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: "root",
    password: "password",
    database: "mydb"
});

app.get("/api/users", (req, res) => {
    db.query("SELECT * FROM users", (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});


app.get("/api/questions", (req, res) => {
    db.query(`
        SELECT 
            q.id AS question_id,
            q.question,
            o.id AS option_id,
            o.text
        FROM questions q
        JOIN options o ON q.id = o.question_id
    `, (err, rows) => {
 

    if (err) return res.status(500).send(err);

        const result = [];

        rows.forEach(row => {
            let question = result.find(q => q.id === Number(row.question_id));

            if (!question) {
                question = {
                    id: row.question_id,
                    question: row.question,
                    options: []
                };
                result.push(question);
            }

            question.options.push({
                id: row.option_id,
                text: row.text
            });
        });

        console.log("RESULT:", result);

        res.json(result);
    });
});



app.post("/api/answers", (req, res) => {
    const { exam_id, question_id, answer } = req.body;

    db.query(
        "INSERT INTO answers (exam_id, question_id, answer) VALUES (?, ?, ?)",
        [exam_id, question_id, answer],
        (err) => {
        if (err) return res.status(500).send(err);
            res.sendStatus(200);
        }
    );
});


app.listen(3000, () => console.log("Server running on port 3000"));

console.log("SERVER UPDATED");
