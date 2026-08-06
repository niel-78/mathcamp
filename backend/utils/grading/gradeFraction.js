export const gradeFraction = (
    studentAnswer,
    correctAnswer,
    config = {}
) => {

    if (config.allow_decimal) {

        const student =
            Number(studentAnswer);

        if (!Number.isNaN(student)) {

            const [
                numerator,
                denominator
            ] = correctAnswer
                .replace(/\s/g, "")
                .split("/")
                .map(Number);

            const correct =
                numerator /
                denominator;

            return (
                Math.abs(
                    student - correct
                ) < Number.EPSILON
            );
        }
    }

    const fractionRegex =
        /^-?\d+\s*\/\s*-?\d+$/;

    if (
        !fractionRegex.test(
            studentAnswer
        )
    ) {
        return false;
    }

    if (config.allow_decimal) {

        const student =
            Number(studentAnswer);

        if (!Number.isNaN(student)) {

            const [
                numerator,
                denominator
            ] = correctAnswer
                .replace(/\s/g, "")
                .split("/")
                .map(Number);

            const correct =
                numerator /
                denominator;

            return student === correct;
        }
    }


    const parseFraction = (
        fraction
    ) => {

        const [
            numerator,
            denominator
        ] = fraction
            .replace(/\s/g, "")
            .split("/")
            .map(Number);

        return {
            numerator,
            denominator
        };
    };

    const student =
        parseFraction(studentAnswer);

    const correct =
        parseFraction(correctAnswer);

    const sameValue =
        student.numerator *
        correct.denominator ===
        correct.numerator *
        student.denominator;

    if (!sameValue) {
        return false;
    }

    if (
        config.require_simplified
    ) {

        return (
            gcd(
                student.numerator,
                student.denominator
            ) === 1
        );

    }

    return true;
};