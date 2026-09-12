// services/AssessmentEngine.js

import db from "../db.js";
import { gradeAnswer } from "../utils/grading/gradeAnswer.js";
import { scoreNumericInput } from "../utils/grading/gradeNumericInput.js";

export default class AssessmentEngine {

    static buildSelectionReason({
        sectionName,
        abilityName,
        levelName,
        phase = null
    }) {

        const parts = [];

        if (phase === "komplettering") {
            parts.push("Komplettering: Väljer uppgift");
        } else if (phase === "träning") {
            parts.push("Träning: Väljer uppgift");
        } else {
            parts.push("Väljer uppgift");
        }

        if (sectionName) {
            parts.push(`från sektion "${sectionName}"`);
        }

        if (abilityName) {
            parts.push(`med förmåga "${abilityName}"`);
        }

        if (levelName) {
            parts.push(`på nivå ${levelName}`);
        }

        return parts.join(" ");

    }

    static async getPreviousDiagnosticAbilities(
        connection,
        groupId,
        currentGroupAssessmentId
    ) {

        if (!groupId) {
            return [];
        }

        const [previousDiagnostics] =
            await connection.query(
                `
                SELECT
                    ga.id,
                    ga.config,
                    lga.lesson_id
                FROM group_assessments ga
                INNER JOIN assessments a
                    ON a.id = ga.assessment_id
                LEFT JOIN lesson_group_assessments lga
                    ON lga.group_assessment_id = ga.id
                WHERE ga.group_id = ?
                    AND a.type = 'diagnostic'
                    AND ga.mode != 'test'
                    AND ga.deleted_at IS NULL
                    AND ga.id != ?
                `,
                [
                    groupId,
                    currentGroupAssessmentId
                ]
            );

        if (previousDiagnostics.length === 0) {
            return [];
        }

        const previousBlockIds = new Set();
        const previousLessonIds = [];
        const abilityIds = new Set();

        for (const diag of previousDiagnostics) {
            const diagConfig =
                typeof diag.config === "string"
                    ? JSON.parse(diag.config || "{}")
                    : diag.config || {};

            if (Array.isArray(diagConfig.selected_block_ids)) {
                for (const bId of diagConfig.selected_block_ids) {
                    previousBlockIds.add(Number(bId));
                }
            }
            if (diagConfig.ability_question_counts) {
                for (const aId of Object.keys(diagConfig.ability_question_counts)) {
                    abilityIds.add(Number(aId));
                }
            }
            if (diag.lesson_id) {
                previousLessonIds.push(diag.lesson_id);
            }
        }

        // Hämta även block som förekommit i provfrågor i tidigare diagnoser
        const [attemptBlocks] =
            await connection.query(
                `
                SELECT DISTINCT q.block_id
                FROM assessment_attempts aa
                INNER JOIN attempt_questions aq
                    ON aq.attempt_id = aa.id
                INNER JOIN questions q
                    ON q.id = aq.question_id
                WHERE aa.group_assessment_id IN (?)
                `,
                [previousDiagnostics.map(d => d.id)]
            );

        for (const row of attemptBlocks) {
            if (row.block_id) {
                previousBlockIds.add(Number(row.block_id));
            }
        }

        // Hämta även block från lektioner kopplade till tidigare diagnoser
        if (previousLessonIds.length > 0) {
            const [lessonBlocks] =
                await connection.query(
                    `
                    SELECT DISTINCT bs.block_id
                    FROM lesson_sections ls
                    INNER JOIN block_sections bs
                        ON bs.section_id = ls.section_id
                    INNER JOIN blocks b
                        ON b.id = bs.block_id
                    WHERE ls.lesson_id IN (?)
                        AND b.deleted_at IS NULL
                        AND b.archived_at IS NULL
                    `,
                    [previousLessonIds]
                );

            for (const row of lessonBlocks) {
                if (row.block_id) {
                    previousBlockIds.add(Number(row.block_id));
                }
            }
        }

        if (previousBlockIds.size > 0) {
            const [blockAbilities] =
                await connection.query(
                    `
                    SELECT DISTINCT ba.ability_id
                    FROM block_abilities ba
                    INNER JOIN abilities a
                        ON a.id = ba.ability_id
                    WHERE ba.block_id IN (?)
                        AND a.deleted_at IS NULL
                    `,
                    [[...previousBlockIds]]
                );

            for (const row of blockAbilities) {
                if (row.ability_id) {
                    abilityIds.add(Number(row.ability_id));
                }
            }
        }

        return [...abilityIds];

    }

    static async getNextQuestion(
        connection,
        attemptId,
        reserveQuestion = true
    ) {

        const [[attempt]] =
            await connection.query(
                `
                SELECT
                    ea.*,
                    ga.group_id
                FROM assessment_attempts ea
                INNER JOIN group_assessments ga
                    ON ga.id = ea.group_assessment_id
                WHERE ea.id = ?
                `,
                [attemptId]
            );

        if (!attempt) {
            return null;
        }

        const userId =
            attempt.user_id;
        const groupId =
            attempt.group_id;
        const groupAssessmentId =
            attempt.group_assessment_id;

        // 1. Förmågor som ingått i tidigare diagnoser för gruppen
        const previousDiagnosticAbilities =
            await this.getPreviousDiagnosticAbilities(
                connection,
                groupId,
                groupAssessmentId
            );

        // 2. Förmågor som eleven tidigare har testats på (före detta provförsök)
        const [priorResults] =
            await connection.query(
                `
                SELECT DISTINCT sah.ability_id
                FROM student_ability_history sah
                WHERE sah.user_id = ?
                    AND sah.assessment_attempt_id != ?
                `,
                [userId, attemptId]
            );

        const priorTestedAbilitySet = new Set(
            priorResults.map(r => Number(r.ability_id))
        );

        const attemptConfig =
            typeof attempt.config === "string"
                ? JSON.parse(attempt.config || "{}")
                : attempt.config || {};

        const completionQuestionsPerAbility =
            Math.max(
                1,
                Number(
                    attemptConfig?.attempt?.completionQuestionsPerAbility ??
                    attemptConfig?.completion_questions_per_ability
                ) || 1
            );

        // 3. Antal frågor per förmåga som redan har serverats i detta provförsök
        const [currentAttemptAbilities] =
            await connection.query(
                `
                SELECT ba.ability_id, COUNT(*) AS count
                FROM attempt_questions aq
                INNER JOIN questions q
                    ON q.id = aq.question_id
                INNER JOIN block_abilities ba
                    ON ba.block_id = q.block_id
                WHERE aq.attempt_id = ?
                GROUP BY ba.ability_id
                `,
                [attemptId]
            );

        const currentAttemptAbilityCounts = new Map(
            currentAttemptAbilities.map(r => [Number(r.ability_id), Number(r.count)])
        );

        // =========================================================================
        // DEL 1: KOMPLETTERING
        // Förmågor som ingått i tidigare diagnoser men som eleven saknar resultat på,
        // och som ännu inte nått det önskade antalet kompletteringsuppgifter i detta provförsök.
        // =========================================================================
        const missingAbilities = previousDiagnosticAbilities.filter(
            aId => !priorTestedAbilitySet.has(aId) &&
                   (currentAttemptAbilityCounts.get(aId) || 0) < completionQuestionsPerAbility
        );

        for (const abilityId of missingAbilities) {

            const currentLevelId =
                await this.getCurrentLevel(
                    connection,
                    userId,
                    abilityId
                );

            const [[question]] =
                await connection.query(
                    `
                    SELECT DISTINCT
                        q.*

                    FROM questions q

                    INNER JOIN blocks b
                        ON b.id = q.block_id

                    INNER JOIN block_abilities ba
                        ON ba.block_id = q.block_id

                    WHERE ba.ability_id = ?
                    AND q.series_level_id = ?

                    AND q.archived_at IS NULL
                    AND q.deleted_at IS NULL
                    AND b.archived_at IS NULL
                    AND b.deleted_at IS NULL
                    AND q.excluded_from_assessments = 0

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
                        abilityId,
                        currentLevelId,
                        userId
                    ]
                );

            if (question) {

                if (reserveQuestion) {
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
                }

                const [[abilityInfo]] =
                    await connection.query(
                        `
                        SELECT name
                        FROM abilities
                        WHERE id = ?
                        `,
                        [abilityId]
                    );

                const [[levelInfo]] =
                    await connection.query(
                        `
                        SELECT name
                        FROM ability_series_levels
                        WHERE id = ?
                        `,
                        [currentLevelId]
                    );

                const [[sectionInfo]] =
                    await connection.query(
                        `
                        SELECT s.title
                        FROM block_sections bs
                        INNER JOIN sections s
                            ON s.id = bs.section_id
                        WHERE bs.block_id = ?
                        ORDER BY s.title
                        LIMIT 1
                        `,
                        [question.block_id]
                    );

                question.selection_reason =
                    this.buildSelectionReason({
                        sectionName: sectionInfo?.title,
                        abilityName: abilityInfo?.name,
                        levelName: levelInfo?.name,
                        phase: "komplettering"
                    });

                return question;

            }

        }

        // =========================================================================
        // DEL 2: TRÄNING
        // Eleven tränar på förmågor som den tidigare skrivit diagnos på
        // (förmågor från tidigare diagnoser som eleven har resultat på, eller alla diagnostiserade förmågor)
        // =========================================================================
        const eligibleTrainingAbilities =
            previousDiagnosticAbilities.length > 0
                ? previousDiagnosticAbilities.filter(
                    aId => priorTestedAbilitySet.has(aId) || currentAttemptAbilitySet.has(aId)
                )
                : null;

        const abilities =
            await this.findTargetAbilities(
                connection,
                userId,
                eligibleTrainingAbilities
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

                    INNER JOIN blocks b
                        ON b.id = q.block_id

                    INNER JOIN block_abilities ba
                        ON ba.block_id = q.block_id

                    WHERE ba.ability_id = ?
                    AND q.series_level_id = ?

                    AND q.archived_at IS NULL
                    AND q.deleted_at IS NULL
                    AND b.archived_at IS NULL
                    AND b.deleted_at IS NULL
                    AND q.excluded_from_assessments = 0

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

                if (reserveQuestion) {
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
                }

                const [[abilityInfo]] =
                    await connection.query(
                        `
                        SELECT name
                        FROM abilities
                        WHERE id = ?
                        `,
                        [ability.ability_id]
                    );

                const [[levelInfo]] =
                    await connection.query(
                        `
                        SELECT name
                        FROM ability_series_levels
                        WHERE id = ?
                        `,
                        [currentLevelId]
                    );

                const [[sectionInfo]] =
                    await connection.query(
                        `
                        SELECT s.title
                        FROM block_sections bs
                        INNER JOIN sections s
                            ON s.id = bs.section_id
                        WHERE bs.block_id = ?
                        ORDER BY s.title
                        LIMIT 1
                        `,
                        [question.block_id]
                    );

                question.selection_reason =
                    this.buildSelectionReason({
                        sectionName: sectionInfo?.title,
                        abilityName: abilityInfo?.name,
                        levelName: levelInfo?.name,
                        phase: "träning"
                    });

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
        correct,
        masteryMultiplier = null
    ) {

        const multiplier =
            masteryMultiplier ?? (correct ? 1 : -1);

        const [[attempt]] =
            await connection.query(
                `
                SELECT mode, config
                FROM assessment_attempts
                WHERE id = ?
                `,
                [attemptId]
            );

        // if (attempt?.mode === "test") {
        //     return;
        // }

        const attemptConfig =
            typeof attempt?.config === "string"
                ? JSON.parse(attempt.config || "{}")
                : attempt?.config || {};

        const promoteAfterQuestions =
            Math.max(
                1,
                Number(attemptConfig?.attempt?.promoteAfterQuestions) || 1
            );

        const demoteAfterQuestions =
            Math.max(
                1,
                Number(attemptConfig?.attempt?.demoteAfterQuestions) || 1
            );

        const [[questionRow]] =
            await connection.query(
                `
                SELECT series_level_id
                FROM questions
                WHERE id = ?
                `,
                [questionId]
            );

        const questionLevelId =
            questionRow?.series_level_id ?? null;

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
                Number(current?.mastery_score ?? 50);

            const masteryAfter =
                Math.max(
                    0,
                    Math.min(
                        100,
                        masteryBefore +
                        multiplier * 5
                    )
                );

            await connection.query(
                `
                INSERT INTO student_ability_mastery (

                    user_id,
                    ability_id,
                    mastery_score,
                    attempts,
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

                    attempts =
                        attempts + 1,

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

            const [recentHistory] =
                await connection.query(
                    `
                    SELECT
                        sah.correct,
                        q.series_level_id
                    FROM student_ability_history sah
                    JOIN questions q ON q.id = sah.question_id
                    WHERE sah.user_id = ?
                      AND sah.ability_id = ?
                      AND sah.assessment_attempt_id = ?
                    ORDER BY sah.id DESC
                    `,
                    [
                        userId,
                        ability.ability_id,
                        attemptId
                    ]
                );

            let consecutiveCount = 0;
            for (const entry of recentHistory) {
                const sameLevel =
                    questionLevelId != null
                        ? entry.series_level_id === questionLevelId
                        : true;
                if (sameLevel && Boolean(entry.correct) === Boolean(correct)) {
                    consecutiveCount++;
                } else {
                    break;
                }
            }

            if (correct) {
                if (consecutiveCount >= promoteAfterQuestions) {
                    await this.promoteLevel(
                        connection,
                        userId,
                        ability.ability_id
                    );
                }
            } else {
                if (consecutiveCount >= demoteAfterQuestions) {
                    await this.demoteLevel(
                        connection,
                        userId,
                        ability.ability_id
                    );
                }
            }

        }

    }

    static async getDiagnosticSeedQuestions(
        connection,
        lessonId,
        attemptId,
        maxQuestionCount = null,
        selectedBlockIds = null,
        seedQuestionCount = null,
        questionsPerAbility = 1,
        abilityQuestionCounts = {}
    ) {

        const [[attempt]] =
            await connection.query(
                `
                SELECT user_id
                FROM assessment_attempts
                WHERE id = ?
                `,
                [attemptId]
            );

        if (!attempt) {
            throw new Error(
                "Attempt not found"
            );
        }

        const plan =
            await this.getDiagnosticSeedPlan(
                lessonId,
                attempt.user_id,
                selectedBlockIds,
                questionsPerAbility,
                abilityQuestionCounts
            );

        const questions =
            plan.questions.map(
                item => item.question
            );

        const configuredSeedQuestionCount =
            Number.isInteger(seedQuestionCount) &&
            seedQuestionCount > 0
                ? seedQuestionCount
                : null;

        const limitedQuestions =
            Number.isInteger(configuredSeedQuestionCount) &&
            configuredSeedQuestionCount > 0
                ? questions.slice(0, configuredSeedQuestionCount)
                : questions;

        for (const question of limitedQuestions) {
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
                    attempt.user_id,
                    question.id
                ]
            );
        }

        return limitedQuestions;

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
        let pointsFraction = 0;
        let masteryMultiplier = null;

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

            pointsFraction = correct ? 1 : 0;

        } else if (
            question.question_type === "numeric_input"
        ) {

            const [correctOptions] =
                await connection.query(
                    `
                    SELECT text
                    FROM options
                    WHERE question_id = ?
                    AND is_correct = 1
                    ORDER BY id
                    `,
                    [questionId]
                );

            const config =
                typeof question.answer_config === "string"
                    ? JSON.parse(
                        question.answer_config
                    )
                    : question.answer_config;

            const score = scoreNumericInput(
                answer.text_answer,
                correctOptions.map(o => o.text),
                config
            );

            correct = score.correct;
            pointsFraction = score.pointsFraction;
            masteryMultiplier = score.masteryMultiplier;

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

            pointsFraction = correct ? 1 : 0;

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
            correct,
            masteryMultiplier
        );

        return {
            correct,
            pointsFraction
        };

    }

    static async findTargetAbilities(
        connection,
        userId,
        filterAbilityIds = null
    ) {

        const filterSet =
            Array.isArray(filterAbilityIds) && filterAbilityIds.length > 0
                ? new Set(filterAbilityIds.map(Number))
                : null;

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

        if (filterSet) {
            for (const aId of filterSet) {
                scores.set(aId, 50);
            }
        }

        for (const row of masteries) {

            const aId = Number(row.ability_id);
            if (filterSet && !filterSet.has(aId)) {
                continue;
            }

            scores.set(
                aId,
                Math.max(
                    0,
                    100 - row.mastery_score
                )
            );

        }

        for (const row of recentHistory) {

            const aId = Number(row.ability_id);
            if (filterSet && !filterSet.has(aId)) {
                continue;
            }

            const current =
                scores.get(
                    aId
                ) || 0;

            if (row.correct) {

                scores.set(
                    aId,
                    current - 5
                );

            } else {

                scores.set(
                    aId,
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
        lessonId,
        userId = null,
        selectedBlockIds = null,
        questionsPerAbility = 1,
        abilityQuestionCounts = {},
        completionQuestionsPerAbility = 1
    ) {

        const selectedBlockIdSet =
            Array.isArray(selectedBlockIds)
                ? new Set(
                    selectedBlockIds.map(Number)
                )
                : null;

        const [[lesson]] =
            await db.query(
                `
                SELECT
                    group_id,
                    starts_at
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
                    AND aa.mode != 'test'
                    AND ga.deleted_at IS NULL

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

        const [previousDiagnostics] =
            await db.query(
                `
                SELECT
                    ga.id,
                    ga.config,
                    lga.lesson_id
                FROM group_assessments ga
                INNER JOIN assessments a
                    ON a.id = ga.assessment_id
                LEFT JOIN lesson_group_assessments lga
                    ON lga.group_assessment_id = ga.id
                WHERE ga.group_id = ?
                    AND a.type = 'diagnostic'
                    AND ga.mode != 'test'
                    AND ga.deleted_at IS NULL
                    AND (lga.lesson_id IS NULL OR lga.lesson_id != ?)
                `,
                [
                    lesson.group_id,
                    lessonId
                ]
            );

        const previousBlockIdsSet = new Set();
        for (const diag of previousDiagnostics) {
            const diagConfig =
                typeof diag.config === "string"
                    ? JSON.parse(diag.config || "{}")
                    : diag.config || {};

            if (Array.isArray(diagConfig.selected_block_ids)) {
                for (const bId of diagConfig.selected_block_ids) {
                    previousBlockIdsSet.add(Number(bId));
                }
            }
        }

        const [previousAttemptBlocks] =
            await db.query(
                `
                SELECT DISTINCT q.block_id
                FROM assessment_attempts aa
                INNER JOIN group_assessments ga
                    ON ga.id = aa.group_assessment_id
                INNER JOIN assessments a
                    ON a.id = ga.assessment_id
                LEFT JOIN lesson_group_assessments lga
                    ON lga.group_assessment_id = ga.id
                INNER JOIN attempt_questions aq
                    ON aq.attempt_id = aa.id
                INNER JOIN questions q
                    ON q.id = aq.question_id
                WHERE ga.group_id = ?
                    AND a.type = 'diagnostic'
                    AND ga.mode != 'test'
                    AND ga.deleted_at IS NULL
                    AND (lga.lesson_id IS NULL OR lga.lesson_id != ?)
                `,
                [
                    lesson.group_id,
                    lessonId
                ]
            );

        for (const row of previousAttemptBlocks) {
            if (row.block_id) {
                previousBlockIdsSet.add(Number(row.block_id));
            }
        }

        const previousSectionIdSet = new Set();
        if (previousBlockIdsSet.size > 0) {
            const [previousSectionRows] =
                await db.query(
                    `
                    SELECT DISTINCT section_id
                    FROM block_sections
                    WHERE block_id IN (?)
                    `,
                    [[...previousBlockIdsSet]]
                );
            for (const row of previousSectionRows) {
                if (row.section_id) {
                    previousSectionIdSet.add(Number(row.section_id));
                }
            }
        }

        const previousLessonIds =
            previousDiagnostics
                .map(d => d.lesson_id)
                .filter(Boolean);

        if (previousLessonIds.length > 0) {
            const [previousLessonSections] =
                await db.query(
                    `
                    SELECT DISTINCT section_id
                    FROM lesson_sections
                    WHERE lesson_id IN (?)
                    `,
                    [previousLessonIds]
                );
            for (const row of previousLessonSections) {
                if (row.section_id) {
                    previousSectionIdSet.add(Number(row.section_id));
                }
            }
        }

        const [blocks] =
            await db.query(
                `
                SELECT DISTINCT

                    b.id,
                    b.title AS block_title,

                    a.id AS ability_id,
                    a.name AS block_name,

                    s.id AS section_id,
                    s.title AS section_name,
                    s.page_number AS section_page_number

                FROM lessons l

                INNER JOIN lesson_sections ls
                    ON ls.lesson_id = l.id

                INNER JOIN sections s
                    ON s.id = ls.section_id

                INNER JOIN block_sections bs
                    ON bs.section_id = s.id

                INNER JOIN blocks b
                    ON b.id = bs.block_id

                LEFT JOIN block_abilities ba
                    ON ba.block_id = b.id

                LEFT JOIN abilities a
                    ON a.id = ba.ability_id

                WHERE l.group_id = ?
                AND l.starts_at <= ?
                AND b.deleted_at IS NULL
                AND b.archived_at IS NULL

                ORDER BY
                    s.title,
                    b.id,
                    a.name
                `,
                [
                    lesson.group_id,
                    lesson.starts_at
                ]
            );

        const questions = [];

        // Deduplicate blocks and keep only those with abilities
        const uniqueBlocks = [];
        const seenBlockIds = new Set();
        
        for (const block of blocks) {
            // Skip blocks without abilities (NULL ability_id from LEFT JOIN)
            if (!block.ability_id) {
                continue;
            }
            
            // Skip duplicate block entries (keep first one with each ability)
            const key = `${block.id}-${block.ability_id}`;
            if (seenBlockIds.has(key)) {
                continue;
            }
            seenBlockIds.add(key);
            uniqueBlocks.push(block);
        }

        // Selected areas (blocks) must always be tested first, so their
        // questions aren't cut off by the maxQuestionCount slice later on.
        if (selectedBlockIdSet) {

            uniqueBlocks.sort((a, b) => {

                const aSelected =
                    selectedBlockIdSet.has(a.id) ? 0 : 1;

                const bSelected =
                    selectedBlockIdSet.has(b.id) ? 0 : 1;

                return aSelected - bSelected;

            });

        }

        for (const block of uniqueBlocks) {

            if (
                selectedBlockIdSet &&
                !selectedBlockIdSet.has(block.id)
            ) {
                continue;
            }

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

            const countForAbility =
                abilityQuestionCounts?.[block.ability_id] ??
                abilityQuestionCounts?.[String(block.ability_id)] ??
                questionsPerAbility;

            const limit = Math.max(1, Number(countForAbility) || 1);

            const [selectedQuestions] =
                await db.query(
                    `
                    SELECT
                        q.*

                    FROM questions q

                    WHERE q.block_id = ?

                    AND q.archived_at IS NULL
                    AND q.deleted_at IS NULL
                    AND q.excluded_from_assessments = 0

                    AND (
                        ? IS NULL
                        OR NOT EXISTS (
                            SELECT 1
                            FROM student_question_history h
                            WHERE h.user_id = ?
                            AND h.question_id = q.id
                        )
                    )

                    ORDER BY RAND()

                    LIMIT ?
                    `,
                    [
                        block.id,
                        userId,
                        userId,
                        limit
                    ]
                );

            for (const question of selectedQuestions) {

                question.selection_reason =
                    this.buildSelectionReason({
                        sectionName: block.section_name,
                        abilityName: block.block_name,
                        levelName: firstLevel.name
                    });

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

        const sectionsMap = new Map();

        for (const block of blocks) {

            if (!sectionsMap.has(block.section_id)) {

                const isPreviouslyIncluded =
                    previousSectionIdSet.has(Number(block.section_id));

                sectionsMap.set(
                    block.section_id,
                    {
                        id: block.section_id,
                        name: block.section_name,
                        pageNumber: block.section_page_number,
                        previouslyIncluded: isPreviouslyIncluded,
                        blocks: []
                    }
                );

            }

            const section =
                sectionsMap.get(block.section_id);

            if (
                !section.blocks.some(
                    b => b.id === block.id
                )
            ) {

                section.blocks.push({
                    id: block.id,
                    name:
                        block.block_title ||
                        block.block_name
                });

            }

        }

        const sections =
            [...sectionsMap.values()].sort((a, b) => {
                const pageA = a.pageNumber != null ? Number(a.pageNumber) : -1;
                const pageB = b.pageNumber != null ? Number(b.pageNumber) : -1;
                if (pageB !== pageA) {
                    return pageB - pageA;
                }
                return (a.name || "").localeCompare(b.name || "", "sv");
            });

        const abilitiesMap = new Map();
        for (const block of blocks) {
            if (block.ability_id && !abilitiesMap.has(block.ability_id)) {
                abilitiesMap.set(block.ability_id, {
                    id: block.ability_id,
                    name: block.block_name,
                    section_ids: []
                });
            }
            if (block.ability_id && block.section_id) {
                const item = abilitiesMap.get(block.ability_id);
                if (!item.section_ids.includes(block.section_id)) {
                    item.section_ids.push(block.section_id);
                }
            }
        }
        const abilities = [...abilitiesMap.values()];

        return {

            lessonId,

            lastDiagnosticDate,

            sections,

            blocks,

            abilities,

            defaultQuestionsPerAbility: questionsPerAbility,

            defaultCompletionQuestionsPerAbility: completionQuestionsPerAbility,

            previouslyIncludedSectionIds: [...previousSectionIdSet],

            questions

        };

    }


}