import { normalizeAnswer } from "../normalizeAnswer.js";

export const gradeVariables = (
    studentAnswer,
    correctAnswer,
    config = {}
) => {

    console.log("gradeVariables");
    console.log(config);

    try {

        const parse = (text) => {

            return normalizeAnswer(
                text,
                {
                    removeCommas: false
                }
            )
                .split(",")
                .map(part => {

                    const [name, value] =
                        part.split("=");

                    return {
                        name: name?.trim(),
                        value: normalizeAnswer(value)
                    };

                })
                .filter(
                    item =>
                        item.name &&
                        item.value
                );
        };

        const student =
            parse(studentAnswer);

        const correct =
            parse(correctAnswer);

        if (config.ignore_variable_names) {

            const studentValues =
                student
                    .map(x => x.value)
                    .sort();

            const correctValues =
                correct
                    .map(x => x.value)
                    .sort();

            return (
                JSON.stringify(studentValues) ===
                JSON.stringify(correctValues)
            );
        }

        const studentMap =
            Object.fromEntries(
                student.map(x => [
                    x.name,
                    x.value
                ])
            );

        const correctMap =
            Object.fromEntries(
                correct.map(x => [
                    x.name,
                    x.value
                ])
            );

        return (
            JSON.stringify(studentMap) ===
            JSON.stringify(correctMap)
        );

    } catch (error) {

        console.error(error);

        return false;
    }
};