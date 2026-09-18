import "dotenv/config";
import mysql from "mysql2/promise";

import { gradeAnswer } from "../utils/grading/gradeAnswer.js";
import { scoreNumericInput } from "../utils/grading/gradeNumericInput.js";
import AssessmentEngine from "../services/AssessmentEngine.js";

const execute = process.argv.includes("--execute");

const parseJson = value =>
    typeof value === "string" ? JSON.parse(value || "{}") : value || {};

async function gradeStoredAnswer(connection, question, answer) {
    const config = parseJson(question.answer_config);

    if (question.question_type === "text") {
        const [[correctOption]] = await connection.query(
            `
            SELECT text
            FROM options
            WHERE question_id = ?
              AND is_correct = 1
            ORDER BY id
            LIMIT 1
            `,
            [question.id]
        );

        return gradeAnswer({
            studentAnswer: answer?.text_answer,
            correctAnswer: correctOption?.text,
            config
        });
    }

    if (["numeric_input", "equation"].includes(question.question_type)) {
        const [correctOptions] = await connection.query(
            `
            SELECT text
            FROM options
            WHERE question_id = ?
              AND is_correct = 1
            ORDER BY id
            `,
            [question.id]
        );

        return scoreNumericInput(
            answer?.text_answer,
            correctOptions.map(option => option.text),
            config
        ).correct;
    }

    const [selectedOptions] = await connection.query(
        `
        SELECT option_id
        FROM answer_options
        WHERE answer_id = ?
        ORDER BY option_id
        `,
        [answer?.id]
    );
    const [correctOptions] = await connection.query(
        `
        SELECT id
        FROM options
        WHERE question_id = ?
          AND is_correct = 1
        ORDER BY id
        `,
        [question.id]
    );

    return JSON.stringify(selectedOptions.map(option => option.option_id)) ===
        JSON.stringify(correctOptions.map(option => option.id));
}

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        dateStrings: true
    });

    try {
        const [attempts] = await connection.query(
            `
            SELECT
                aa.id,
                aa.user_id,
                aa.submitted_at
            FROM assessment_attempts aa
            INNER JOIN group_assessments ga
                ON ga.id = aa.group_assessment_id
            INNER JOIN assessments a
                ON a.id = ga.assessment_id
            WHERE a.type = 'diagnostic'
              AND aa.status = 'submitted'
              AND aa.mode != 'test'
              AND DATE(aa.submitted_at) = CURDATE()
            ORDER BY aa.submitted_at, aa.id
            `
        );

        if (attempts.length === 0) {
            console.log("Inga inskickade diagnoser hittades för dagens DB-datum.");
            return;
        }

        const attemptIds = attempts.map(attempt => attempt.id);
        const placeholders = attemptIds.map(() => "?").join(",");
        const [historyRows] = await connection.query(
            `
            SELECT
                sah.id,
                sah.user_id,
                sah.ability_id,
                sah.question_id,
                sah.assessment_attempt_id,
                sah.correct,
                sah.mastery_before,
                sah.created_at
            FROM student_ability_history sah
            WHERE sah.assessment_attempt_id IN (${placeholders})
            ORDER BY sah.created_at, sah.id
            `,
            attemptIds
        );

        const historyByQuestion = new Map();
        for (const row of historyRows) {
            const key = `${row.assessment_attempt_id}:${row.question_id}`;
            if (!historyByQuestion.has(key)) historyByQuestion.set(key, []);
            historyByQuestion.get(key).push(row);
        }

        const [answers] = await connection.query(
            `
            SELECT aa.*
            FROM assessment_answers aa
            WHERE aa.attempt_id IN (${placeholders})
            `,
            attemptIds
        );
        const answerByQuestion = new Map(
            answers.map(answer => [`${answer.attempt_id}:${answer.question_id}`, answer])
        );

        const questionIds = [...new Set(historyRows.map(row => row.question_id))];
        const questionPlaceholders = questionIds.map(() => "?").join(",");
        const [questions] = await connection.query(
            `SELECT * FROM questions WHERE id IN (${questionPlaceholders})`,
            questionIds
        );
        const questionById = new Map(questions.map(question => [question.id, question]));

        let changedAnswers = 0;
        const newCorrectByQuestion = new Map();
        for (const [key, rows] of historyByQuestion) {
            const [attemptId, questionId] = key.split(":");
            const correct = await gradeStoredAnswer(
                connection,
                questionById.get(Number(questionId)),
                answerByQuestion.get(key)
            );
            newCorrectByQuestion.set(key, correct);
            if (Boolean(rows[0].correct) !== correct) changedAnswers++;
        }

        console.log(`Dagens diagnoser: ${attempts.length}`);
        console.log(`Historikposter som spelas om: ${historyRows.length}`);
        console.log(`Svar som ändrar rätt/fel: ${changedAnswers}`);

        if (!execute) {
            console.log("Torrkörning. Kör med --execute för att skriva ändringarna.");
            return;
        }

        await connection.beginTransaction();

        const pairKeys = new Set(
            historyRows.map(row => `${row.user_id}:${row.ability_id}`)
        );
        const baselines = new Map();
        const progressSnapshots = new Map();

        for (const pairKey of pairKeys) {
            const [userId, abilityId] = pairKey.split(":");
            const targetRows = historyRows.filter(
                row => `${row.user_id}:${row.ability_id}` === pairKey
            );
            const firstTarget = targetRows[0];

            const [allRows] = await connection.query(
                `
                SELECT id, assessment_attempt_id, created_at
                FROM student_ability_history
                WHERE user_id = ?
                  AND ability_id = ?
                ORDER BY created_at, id
                `,
                [userId, abilityId]
            );
            const firstTargetIndex = allRows.findIndex(row => row.id === firstTarget.id);
            const laterOutsideRows = allRows.slice(firstTargetIndex).filter(
                row => !attemptIds.includes(row.assessment_attempt_id)
            );
            if (laterOutsideRows.length > 0) {
                throw new Error(
                    `Avbryter: senare historik finns för user=${userId}, ability=${abilityId}.`
                );
            }

            const [[mastery]] = await connection.query(
                `
                SELECT mastery_score, attempts, correct_answers
                FROM student_ability_mastery
                WHERE user_id = ?
                  AND ability_id = ?
                `,
                [userId, abilityId]
            );
            const [[progress]] = await connection.query(
                `
                SELECT series_level_id
                FROM student_ability_progress
                WHERE user_id = ?
                  AND ability_id = ?
                `,
                [userId, abilityId]
            );

            baselines.set(pairKey, {
                masteryScore: Number(firstTarget.mastery_before),
                attempts: Number(mastery?.attempts || 0) - targetRows.length,
                correctAnswers: Number(mastery?.correct_answers || 0) -
                    targetRows.reduce((sum, row) => sum + Number(row.correct), 0)
            });
            progressSnapshots.set(pairKey, progress?.series_level_id ?? null);
        }

        await connection.query(
            `DELETE FROM student_ability_history WHERE assessment_attempt_id IN (${placeholders})`,
            attemptIds
        );

        for (const [pairKey, baseline] of baselines) {
            const [userId, abilityId] = pairKey.split(":");
            await connection.query(
                `
                UPDATE student_ability_mastery
                SET mastery_score = ?, attempts = ?, correct_answers = ?
                WHERE user_id = ?
                  AND ability_id = ?
                `,
                [
                    baseline.masteryScore,
                    Math.max(0, baseline.attempts),
                    Math.max(0, baseline.correctAnswers),
                    userId,
                    abilityId
                ]
            );
            const levelId = progressSnapshots.get(pairKey);
            if (levelId !== null) {
                await connection.query(
                    `
                    UPDATE student_ability_progress
                    SET series_level_id = ?
                    WHERE user_id = ?
                      AND ability_id = ?
                    `,
                    [levelId, userId, abilityId]
                );
            }
        }

        const gradedQuestions = new Set();
        for (const row of historyRows) {
            const key = `${row.assessment_attempt_id}:${row.question_id}`;
            if (gradedQuestions.has(key)) continue;
            gradedQuestions.add(key);

            const question = questionById.get(row.question_id);
            const correct = newCorrectByQuestion.get(key);
            const attempt = attempts.find(item => item.id === row.assessment_attempt_id);
            await AssessmentEngine.updateMastery(
                connection,
                row.assessment_attempt_id,
                attempt.user_id,
                row.question_id,
                correct,
                null
            );
        }

        await connection.commit();
        console.log("Dagens diagnoser har rättats om.");
    } catch (error) {
        try {
            await connection.rollback();
        } catch {}
        console.error(`Regraderingen misslyckades: ${error.message}`);
        process.exitCode = 1;
    } finally {
        await connection.end();
    }
}

main();