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
     * Hämta alla frågor från provets block
     */
    const [questions] =
        await connection.query(
            `
            SELECT
                q.id,
                q.question,
                q.question_type,
                q.answer_config,
                q.level_id

            FROM questions q

            INNER JOIN blocks b
                ON b.id = q.block_id

            INNER JOIN exam_blocks eb
                ON eb.block_id = b.id

            WHERE eb.exam_id = ?
            `,
            [groupExam.exam_id]
        );

    /*
     * Slumpa frågor om inställningen säger det
     */
    const orderedQuestions =
        groupExam.shuffle_questions

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
            groupExam.shuffle_options

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

        shuffle_questions:
            !!groupExam.shuffle_questions,

        shuffle_options:
            !!groupExam.shuffle_options,

        questions:
            orderedQuestions

    };

}