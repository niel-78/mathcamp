// services/AssessmentEngine.js

import db from "../db.js";
import { gradeAnswer } from "../utils/grading/gradeAnswer.js";

export default class AssessmentEngine {

    static async getNextQuestion(
        connection,
        attemptId
    ) {

        const [[attempt]] =
            await connection.query(
                `
                SELECT *
                FROM assessment_attempts
                WHERE id = ?
                `,
                [attemptId]
            );

        if (!attempt) {
            return null;
        }

        const userId =
            attempt.user_id;

        const abilities =
            await this.findTargetAbilities(
                connection,
                userId
            );

        for (const ability of abilities) {

            const currentLevelId =
                await this.getCurrentLevel(
                    connection,
                    userId,
                    ability.ability_id
                );

            const [[question]] =
                await connection.query(
                    `
                    SELECT DISTINCT
                        q.*

                    FROM questions q

                    INNER JOIN block_abilities ba
                        ON ba.block_id = q.block_id

                    WHERE ba.ability_id = ?
                    AND q.series_level_id = ?

                    AND q.archived_at IS NULL
                    AND q.deleted_at IS NULL

                    AND NOT EXISTS (

                        SELECT 1
                        FROM student_question_history h
                        WHERE h.user_id = ?
                        AND h.question_id = q.id

                    )

                    ORDER BY RAND()

                    LIMIT 1
                    `,
                    [
                        ability.ability_id,
                        currentLevelId,
                        userId
                    ]
                );

            if (question) {

                await connection.query(
                    `
                    INSERT IGNORE INTO
                    student_question_history (
                        user_id,
                        question_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        userId,
                        question.id
                    ]
                );

                return question;

            }

        }

        return null;

    }

    static async updateMastery(
        connection,
        attemptId,
        userId,
        questionId,
        correct
    ) {

        const [[attempt]] =
            await connection.query(
                `
                SELECT mode
                FROM assessment_attempts
                WHERE id = ?
                `,
                [attemptId]
            );

        if (attempt?.mode === "test") {
            return;
        }

        const [abilities] =
            await connection.query(
                `
                SELECT
                    ba.ability_id
                FROM questions q

                INNER JOIN block_abilities ba
                    ON ba.block_id = q.block_id

                WHERE q.id = ?
                `,
                [questionId]
            );

        for (const ability of abilities) {

            const [[current]] =
                await connection.query(
                    `
                    SELECT
                        mastery_score
                    FROM student_ability_mastery
                    WHERE user_id = ?
                        AND ability_id = ?
                    `,
                    [
                        userId,
                        ability.ability_id
                    ]
                );

            const masteryBefore =
                current?.mastery_score ?? 50;

            const masteryAfter =
                Math.max(
                    0,
                    Math.min(
                        100,
                        masteryBefore +
                        (correct ? 5 : -5)
                    )
                );

            await connection.query(
                `
                INSERT INTO student_ability_mastery (

                    user_id,
                    ability_id,
                    mastery_score,
                    questions_answered,
                    correct_answers

                )
                VALUES (

                    ?,
                    ?,
                    ?,
                    1,
                    ?

                )

                ON DUPLICATE KEY UPDATE

                    questions_answered =
                        questions_answered + 1,

                    correct_answers =
                        correct_answers +
                        VALUES(correct_answers),

                    mastery_score = ?
                `,
                [
                    userId,
                    ability.ability_id,
                    masteryAfter,
                    correct ? 1 : 0,
                    masteryAfter
                ]
            );

            await connection.query(
                `
                INSERT INTO student_ability_history (

                    user_id,
                    ability_id,
                    question_id,
                    assessment_attempt_id,
                    correct,
                    mastery_before,
                    mastery_after

                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    ability.ability_id,
                    questionId,
                    attemptId,
                    correct ? 1 : 0,
                    masteryBefore,
                    masteryAfter
                ]
            );

        }

    }

    static async getDiagnosticSeedQuestions(
        lessonId,
        assessmentId
    ) {

        const plan =
            await this.getDiagnosticSeedPlan(
                lessonId,
                assessmentId
            );

        const questions =
            plan.questions.map(
                item => item.question
            );

        return questions;

    }

    static async evaluateAnswer(
        connection,
        attemptId,
        questionId
    ) {

        const [[question]] =
            await connection.query(
                `
                SELECT *
                FROM questions
                WHERE id = ?
                `,
                [questionId]
            );

        if (!question) {

            throw new Error(
                "Question not found"
            );

        }

        const [[answer]] =
            await connection.query(
                `
                SELECT *
                FROM assessment_answers
                WHERE attempt_id = ?
                AND question_id = ?
                `,
                [
                    attemptId,
                    questionId
                ]
            );

        if (!answer) {

            throw new Error(
                "Answer not found"
            );

        }

        let correct = false;

        if (
            question.question_type === "text"
        ) {

            const [[correctOption]] =
                await connection.query(
                    `
                    SELECT text
                    FROM options
                    WHERE question_id = ?
                    AND is_correct = 1
                    LIMIT 1
                    `,
                    [questionId]
                );

            const config =
                typeof question.answer_config === "string"
                    ? JSON.parse(
                        question.answer_config
                    )
                    : question.answer_config;

            correct = gradeAnswer({
                studentAnswer:
                    answer.text_answer,
                correctAnswer:
                    correctOption?.text,
                config
            });

        } else {

            const [selectedOptions] =
                await connection.query(
                    `
                    SELECT option_id
                    FROM answer_options
                    WHERE answer_id = ?
                    ORDER BY option_id
                    `,
                    [answer.id]
                );

            const [correctOptions] =
                await connection.query(
                    `
                    SELECT id
                    FROM options
                    WHERE question_id = ?
                    AND is_correct = 1
                    ORDER BY id
                    `,
                    [questionId]
                );

            const selectedIds =
                selectedOptions
                    .map(x => x.option_id);

            const correctIds =
                correctOptions
                    .map(x => x.id);

            correct =
                JSON.stringify(
                    selectedIds
                ) ===
                JSON.stringify(
                    correctIds
                );

        }

        const [[attempt]] =
            await connection.query(
                `
                SELECT *
                FROM assessment_attempts
                WHERE id = ?
                `,
                [attemptId]
            );

        await this.updateMastery(
            connection,
            attemptId,
            attempt.user_id,
            questionId,
            correct
        );

        return {
            correct
        };

    }

    static async findTargetAbilities(
        connection,
        userId
    ) {

        const [masteries] =
            await connection.query(
                `
                SELECT
                    ability_id,
                    mastery_score
                FROM student_ability_mastery
                WHERE user_id = ?
                `,
                [userId]
            );

        const [recentHistory] =
            await connection.query(
                `
                SELECT
                    ability_id,
                    correct
                FROM student_ability_history
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 20
                `,
                [userId]
            );

        const scores = new Map();

        for (const row of masteries) {

            scores.set(
                row.ability_id,
                Math.max(
                    0,
                    100 - row.mastery_score
                )
            );

        }

        for (const row of recentHistory) {

            const current =
                scores.get(
                    row.ability_id
                ) || 0;

            if (row.correct) {

                scores.set(
                    row.ability_id,
                    current - 5
                );

            } else {

                scores.set(
                    row.ability_id,
                    current + 25
                );

            }

        }

        return [...scores.entries()]
            .map(
                ([
                    ability_id,
                    score
                ]) => ({
                    ability_id,
                    score
                })
            )
            .sort(
                (a, b) =>
                    b.score - a.score
            );

    }

    static async getCurrentLevel(
        connection,
        userId,
        abilityId
    ) {

        const [[progress]] =
            await connection.query(
                `
                SELECT
                    sap.series_level_id
                FROM student_ability_progress sap
                WHERE sap.user_id = ?
                AND sap.ability_id = ?
                `,
                [
                    userId,
                    abilityId
                ]
            );

        if (progress) {
            return progress.series_level_id;
        }

        const [[ability]] =
            await connection.query(
                `
                SELECT
                    series_id
                FROM abilities
                WHERE id = ?
                `,
                [abilityId]
            );

        const [[firstLevel]] =
            await connection.query(
                `
                SELECT id
                FROM ability_series_levels
                WHERE series_id = ?
                ORDER BY sort_order
                LIMIT 1
                `,
                [ability.series_id]
            );

        await connection.query(
            `
            INSERT INTO student_ability_progress (
                user_id,
                ability_id,
                series_level_id
            )
            VALUES (?, ?, ?)
            `,
            [
                userId,
                abilityId,
                firstLevel.id
            ]
        );

        return firstLevel.id;

    }

    static async promoteLevel(
        connection,
        userId,
        abilityId
    ) {

        const [[current]] =
            await connection.query(
                `
                SELECT
                    sap.series_level_id,
                    asl.series_id,
                    asl.sort_order
                FROM student_ability_progress sap

                JOIN ability_series_levels asl
                    ON asl.id = sap.series_level_id

                WHERE sap.user_id = ?
                AND sap.ability_id = ?
                `,
                [
                    userId,
                    abilityId
                ]
            );

        if (!current) {
            return;
        }

        const [[nextLevel]] =
            await connection.query(
                `
                SELECT id
                FROM ability_series_levels
                WHERE series_id = ?
                AND sort_order > ?
                ORDER BY sort_order
                LIMIT 1
                `,
                [
                    current.series_id,
                    current.sort_order
                ]
            );

        if (!nextLevel) {
            return;
        }

        await connection.query(
            `
            UPDATE student_ability_progress
            SET series_level_id = ?
            WHERE user_id = ?
            AND ability_id = ?
            `,
            [
                nextLevel.id,
                userId,
                abilityId
            ]
        );

    }

    static async demoteLevel(
        connection,
        userId,
        abilityId
    ) {

        const [[current]] =
            await connection.query(
                `
                SELECT
                    sap.series_level_id,
                    asl.series_id,
                    asl.sort_order
                FROM student_ability_progress sap

                JOIN ability_series_levels asl
                    ON asl.id = sap.series_level_id

                WHERE sap.user_id = ?
                AND sap.ability_id = ?
                `,
                [
                    userId,
                    abilityId
                ]
            );

        if (!current) {
            return;
        }

        const [[nextLevel]] =
            await connection.query(
                `
                SELECT id
                FROM ability_series_levels
                WHERE series_id = ?
                AND sort_order < ?
                ORDER BY sort_order DESC
                LIMIT 1
                `,
                [
                    current.series_id,
                    current.sort_order
                ]
            );

        if (!nextLevel) {
            return;
        }

        await connection.query(
            `
            UPDATE student_ability_progress
            SET series_level_id = ?
            WHERE user_id = ?
            AND ability_id = ?
            `,
            [
                nextLevel.id,
                userId,
                abilityId
            ]
        );

    }

    static async getDiagnosticSeedPlan(
        lessonId
    ) {

        const [[lesson]] =
            await db.query(
                `
                SELECT
                    group_id
                FROM lessons
                WHERE id = ?
                `,
                [lessonId]
            );

        if (!lesson) {

            throw new Error(
                "Lesson not found"
            );

        }

        const [[lastDiagnostic]] =
            await db.query(
                `
                SELECT
                    aa.submitted_at

                FROM assessment_attempts aa

                INNER JOIN group_assessments ga
                    ON ga.id =
                        aa.group_assessment_id

                INNER JOIN assessments a
                    ON a.id =
                        ga.assessment_id

                WHERE ga.group_id = ?
                    AND a.type = 'diagnostic'
                    AND aa.status = 'submitted'

                ORDER BY aa.submitted_at DESC

                LIMIT 1
                `,
                [
                    lesson.group_id
                ]
            );

        const lastDiagnosticDate =
            lastDiagnostic?.submitted_at ??
            "2000-01-01";


        const [blocks] =
            await db.query(
                `
                SELECT DISTINCT

                    b.id,

                    a.id AS ability_id,
                    a.name AS block_name,

                    s.id AS section_id,
                    s.title AS section_name

                FROM lessons l

                INNER JOIN lesson_sections ls
                    ON ls.lesson_id = l.id

                INNER JOIN sections s
                    ON s.id = ls.section_id

                INNER JOIN block_sections bs
                    ON bs.section_id = s.id

                INNER JOIN blocks b
                    ON b.id = bs.block_id

                INNER JOIN block_abilities ba
                    ON ba.block_id = b.id

                INNER JOIN abilities a
                    ON a.id = ba.ability_id

                WHERE l.group_id = ?
                AND l.starts_at > ?

                ORDER BY
                    s.title,
                    a.name
                `,
                [
                    lesson.group_id,
                    lastDiagnosticDate
                ]
            );

        console.log(
            "Diagnostic preview blocks:",
            blocks
        );

        const questions = [];

        for (const block of blocks) {

            const [[ability]] =
                await db.query(
                    `
                    SELECT
                        ba.ability_id,
                        a.series_id

                    FROM block_abilities ba

                    INNER JOIN abilities a
                        ON a.id = ba.ability_id

                    WHERE ba.block_id = ?

                    LIMIT 1
                    `,
                    [block.id]
                );

            if (!ability) {
                continue;
            }

            const [[firstLevel]] =
                await db.query(
                    `
                    SELECT
                        id,
                        name

                    FROM ability_series_levels

                    WHERE series_id = ?

                    ORDER BY sort_order

                    LIMIT 1
                    `,
                    [ability.series_id]
                );

            if (!firstLevel) {
                continue;
            }

            const [[question]] =
                await db.query(
                    `
                    SELECT
                        q.*

                    FROM questions q

                    WHERE q.block_id = ?
                    AND q.series_level_id = ?

                    AND q.archived_at IS NULL
                    AND q.deleted_at IS NULL

                    ORDER BY RAND()

                    LIMIT 1
                    `,
                    [
                        block.id,
                        firstLevel.id
                    ]
                );

            if (question) {

                questions.push({
                    section_id: block.section_id,
                    section_name: block.section_name,

                    block_id: block.id,

                    ability_id: block.ability_id,
                    block_name: block.block_name,

                    series_level_id: firstLevel.id,
                    series_level_name: firstLevel.name,

                    question
                });

            }

        }

        const sections =
            [
                ...new Map(
                    blocks.map(
                        block => [
                            block.section_id,
                            {
                                id:
                                    block.section_id,

                                name:
                                    block.section_name
                            }
                        ]
                    )
                ).values()
            ];

        return {

            lessonId,

            lastDiagnosticDate,

            sections,

            blocks,

            questions

        };

    }


}