import { useMemo, useState } from "react";

import { gradeAnswer }
    from "@/utils/grading/gradeAnswer";

import MathContent
    from "@/components/ui/MathContent";

export default function QuestionTester({
    question
}) {

    const [studentAnswer,
        setStudentAnswer] =
        useState("");

    const answerConfig =
        typeof question.answer_config === "string"
            ? JSON.parse(
                question.answer_config
            )
            : (
                question.answer_config || {}
            );

    const correctAnswer =
        question.options?.find(
            option => option.is_correct
        )?.text ?? "";

    const isCorrect =
        useMemo(() => {

            return gradeAnswer({
                studentAnswer,
                correctAnswer,
                config: answerConfig
            });

        }, [
            studentAnswer,
            correctAnswer,
            answerConfig
        ]);

    return (

        <div
            className="
                border
                rounded-lg
                p-4
                bg-slate-50
                space-y-3
            "
        >

            <h3 className="font-semibold">
                Testa rättning
            </h3>

            <div>

                <strong>Facit:</strong>

                <MathContent
                    value={correctAnswer}
                />

            </div>

            <input
                className="input-standard"
                value={studentAnswer}
                onChange={e =>
                    setStudentAnswer(
                        e.target.value
                    )
                }
                placeholder="Skriv elevsvar..."
            />

            <div>

                <strong>Resultat:</strong>{" "}

                <span
                    className={
                        isCorrect
                            ? "text-green-600"
                            : "text-red-600"
                    }
                >
                    {isCorrect
                        ? "✓ Rätt"
                        : "✗ Fel"}
                </span>

            </div>

        </div>

    );
}