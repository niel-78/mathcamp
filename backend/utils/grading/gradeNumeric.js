export const gradeNumeric = (
    studentAnswer,
    correctAnswer,
    config = {}
) => {

    const student =
        Number(studentAnswer);

    const correct =
        Number(correctAnswer);

    console.log({
        studentAnswer,
        correctAnswer,
        student,
        correct,
        config
    });

    if (
        Number.isNaN(student) ||
        Number.isNaN(correct)
    ) {
        return false;
    }

    if (
        config.tolerance !== undefined &&
        config.tolerance !== ""
    ) {

        const result =
            Math.abs(
                student - correct
            ) <= config.tolerance;

        console.log({
            tolerance:
                config.tolerance,
            difference:
                Math.abs(
                    student - correct
                ),
            result
        });

        return result;
    }


    if (
        config.round_to !== undefined &&
        config.round_to !== ""
    ) {

        const roundedStudent =
            Math.round(
                student / config.round_to
            ) * config.round_to;

        const roundedCorrect =
            Math.round(
                correct / config.round_to
            ) * config.round_to;

        const result =
            roundedStudent ===
            roundedCorrect;

        console.log({
            roundTo:
                config.round_to,
            roundedStudent,
            roundedCorrect,
            result
        });

        return result;
    }


    if (
        config.decimals !== undefined &&
        config.decimals !== ""
    ) {

        const result =
            student.toFixed(
                config.decimals
            ) ===
            correct.toFixed(
                config.decimals
            );

        console.log({
            roundedStudent:
                student.toFixed(
                    config.decimals
                ),
            roundedCorrect:
                correct.toFixed(
                    config.decimals
                ),
            result
        });

        return result;
    }

    return student === correct;
};