import crypto from "crypto";

export async function buildExamSession(
    connection,
    groupExamId
) {

    /*
     * Hämta grupprovet
     */
    const [groupExamRows] =
        await connection.query(
            `
            SELECT
                ge.*,
                e.title AS assessment_title
            FROM group_assessments ge
            INNER JOIN assessments e
                ON e.id = ge.assessment_id
            WHERE ge.id = ?
            `,
            [groupExamId]
        );

    if (
        groupExamRows.length === 0
    ) {

        throw new Error(
            "Provtillfället hittades inte."
        );

    }

    const groupExam =
        groupExamRows[0];

    const config =
        typeof groupExam.config === "string"
            ? JSON.parse(groupExam.config || "{}")
            : groupExam.config || {};

    const questionSelection =
        config.question_selection || {};

    /*
     * Hämta alla block som ingår i provet
     */
    const [blocks] =
        await connection.query(
            `
            SELECT
                b.id,
                eb.sort_order
            FROM blocks b

            INNER JOIN assessment_blocks eb
                ON eb.block_id = b.id

            WHERE eb.assessment_id = ?
                AND b.deleted_at IS NULL

            ORDER BY
                eb.sort_order
            `,
            [groupExam.assessment_id]
        );


    const questions = [];

    /*
     * Bygg frågelistan block för block
     */
    for (const block of blocks) {

        const [blockQuestions] =
            await connection.query(
                `
                SELECT
                    id,
                    question,
                    question_type,
                    answer_config,
                    level_id
                FROM questions
                WHERE block_id = ?
                    AND deleted_at IS NULL
                    AND archived_at IS NULL
                `,
                [block.id]
            );

        if (
            blockQuestions.length === 0
        ) {
            continue;
        }

        /*
         * En fråga per block
         */
        if (
            questionSelection.useDifferentQuestionsInBlock
        ) {

            const randomQuestion =
                blockQuestions[
                    Math.floor(
                        Math.random()
                        * blockQuestions.length
                    )
                ];

            questions.push(
                randomQuestion
            );

        } else {

            /*
             * Alla frågor från blocket
             */
            questions.push(
                ...blockQuestions
            );

        }

    }

    /*
     * Slumpa uppgiftsordning
     */
    const orderedQuestions =
        questionSelection.shuffleQuestions

            ? [...questions].sort(
                () =>
                    Math.random() - 0.5
            )

            : [...questions];

    /*
     * Hämta alternativ för varje fråga
     */
    for (
        const question
        of orderedQuestions
    ) {

        const [options] =
            await connection.query(
                `
                SELECT
                    id,
                    text,
                    is_correct
                FROM options
                WHERE question_id = ?
                    AND deleted_at IS NULL
                `,
                [question.id]
            );

        question.options =
            questionSelection.shuffleOptions

                ? [...options].sort(
                    () =>
                        Math.random() - 0.5
                )

                : options;
    }

    return {

        simulation_id:
            crypto.randomUUID(),

        group_assessment_id:
            groupExam.id,

        assessment_id:
            groupExam.assessment_id,

        assessment_title:
            groupExam.assessment_title,

        config:
            groupExam.config,

        shuffle_order_questions:
            !!questionSelection.shuffleQuestions,

        shuffle_order_options:
            !!questionSelection.shuffleOptions,

        use_different_questions_in_block:
            !!questionSelection.useDifferentQuestionsInBlock,

        questions:
            orderedQuestions

    };

}