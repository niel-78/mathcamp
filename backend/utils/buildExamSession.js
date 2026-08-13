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
                e.title AS exam_title
            FROM group_exams ge
            INNER JOIN exams e
                ON e.id = ge.exam_id
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

            INNER JOIN exam_blocks eb
                ON eb.block_id = b.id

            WHERE eb.exam_id = ?
                AND b.deleted_at IS NULL

            ORDER BY
                eb.sort_order
            `,
            [groupExam.exam_id]
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
            groupExam.use_different_questions_in_block
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
        groupExam.shuffle_order_questions

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
            groupExam.shuffle_order_options

                ? [...options].sort(
                    () =>
                        Math.random() - 0.5
                )

                : options;
    }

    return {

        simulation_id:
            crypto.randomUUID(),

        group_exam_id:
            groupExam.id,

        exam_id:
            groupExam.exam_id,

        exam_title:
            groupExam.exam_title,

        exam_config:
            groupExam.exam_config,

        shuffle_order_questions:
            !!groupExam.shuffle_order_questions,

        shuffle_order_options:
            !!groupExam.shuffle_order_options,

        use_different_questions_in_block:
            !!groupExam.use_different_questions_in_block,

        questions:
            orderedQuestions

    };

}