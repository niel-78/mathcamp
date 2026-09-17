export const normalizeAnswer = (
    text = "",
    {
        removeCommas = true
    } = {}
) => {

    let result = String(text)
        .toLowerCase()
        .trim()
        .replace(/\$/g, "")
        .replace(/\./g, "")
        .replace(/\s+/g, "");

    if (removeCommas) {
        result = result.replace(/,/g, "");
    }

    return result;
};

export const gradeText = (
    studentAnswer,
    correctAnswer,
    gradeAlgebra
) => {

    if (
        normalizeAnswer(studentAnswer) ===
        normalizeAnswer(correctAnswer)
    ) {
        return true;
    }

    return gradeAlgebra(
        String(studentAnswer).replace(/\$/g, ""),
        String(correctAnswer).replace(/\$/g, "")
    );
};