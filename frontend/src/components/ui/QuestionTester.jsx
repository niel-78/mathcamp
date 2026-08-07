import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { gradeAnswer } from "@/utils/grading/gradeAnswer";
import MathContent from "@/components/ui/MathContent";

function Field({
    label,
    children
}) {

    return (

        <div
            className="
                grid
                grid-cols-[120px_1fr]
                items-start
                gap-4
            "
        >

            <div
                className="
                    text-sm
                    font-medium
                    pt-2
                "
            >
                {label}
            </div>

            <div>
                {children}
            </div>

        </div>

    );

}

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
            option =>
                option.is_correct
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
                space-y-4
            "
        >

            <Field
                label="Facit"
            >

                <div
                    className="
                        border
                        border-border
                        rounded-lg
                        p-3
                        bg-muted
                    "
                >

                    <MathContent
                        value={correctAnswer}
                    />

                </div>

            </Field>

            <Field
                label="Elevsvar"
            >

                <Input
                    className="
                        input-standard
                    "
                    value={studentAnswer}
                    onChange={e =>
                        setStudentAnswer(
                            e.target.value
                        )
                    }
                    placeholder="
                        Skriv elevsvar...
                    "
                />

            </Field>

            <Field
                label="Resultat"
            >

                <div
                    className={`
                        font-medium
                        ${
                            isCorrect
                                ? "text-green-600"
                                : "text-red-600"
                        }
                    `}
                >

                    {
                        isCorrect
                            ? "✓ Rätt"
                            : "✗ Fel"
                    }

                </div>

            </Field>

        </div>

    );

}