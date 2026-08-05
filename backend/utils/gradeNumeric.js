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

    if (config.decimals !== undefined) {

        const result =
            student.toFixed(config.decimals) ===
            correct.toFixed(config.decimals);

        console.log({
            roundedStudent:
                student.toFixed(config.decimals),
            roundedCorrect:
                correct.toFixed(config.decimals),
            result
        });

        return result;
    }

    return student === correct;
};