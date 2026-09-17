import { gradeText as gradeTextWithAlgebra }
    from "../../../shared/grading/gradeText.js";
import { gradeAlgebra }
    from "./gradeAlgebra.js";


export const gradeText = (
    studentAnswer,
    correctAnswer
) => {

    return gradeTextWithAlgebra(
        studentAnswer,
        correctAnswer,
        gradeAlgebra
    );
};