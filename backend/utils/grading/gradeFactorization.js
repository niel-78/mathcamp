import { parse } from "mathjs";

import {
    normalizeFactorizationSource,
    scoreFactorization as scoreSharedFactorization
} from "../../../shared/grading/factorization.js";
import { gradeAlgebra } from "./gradeAlgebra.js";

export const scoreFactorization = (
    studentAnswer,
    correctAnswer
) => scoreSharedFactorization({
    studentAnswer,
    correctAnswer,
    parseExpression: parse,
    equivalent: (student, correct) =>
        gradeAlgebra(
            normalizeFactorizationSource(student),
            normalizeFactorizationSource(correct)
        )
});
