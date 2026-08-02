import { useState } from "react";
import { authHeaders } from "@/api/authHeaders";
import { formatValue } from "@/utils/formatValue";
import { API_URL } from "@/config";
import Question from "./Block/Question";

export default function Block({ block, exam, onChanged, editMode }) {
    const [newQuestion, setNewQuestion] = useState("");

    const deleteBlock = async (block) => {

        const confirmed = window.confirm(
            `Ta bort blocket "${block.name}"?`
        );

        if (!confirmed) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/${exam.id}/blocks/${block.id}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        onChanged();
    };

    const renameBlock = async (block) => {

        const name = prompt(
            "Nytt namn på blocket",
            block.name
        );

        if (!name) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/blocks/${block.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    name
                })
            }
        );

        onChanged();
    };


    const createQuestion = async () => {

        if (!newQuestion.trim()) {
            return;
        }

        const response = await fetch(
            `${API_URL}/api/teacher/exams/blocks/${block.id}/questions`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: newQuestion,
                    type: 1,
                    math_config: {
                        mode: "numeric"
                    }
                })
            }
        );

        const data = await response.json();

        setNewQuestion("");

        onChanged(data.id);
    };

    const moveUp = async (block) => {

        const previousBlock = exam.blocks
            .filter(b => b.order_by < block.order_by)
            .sort((a, b) => b.order_by - a.order_by)[0];

        if (!previousBlock) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/${exam.id}/blocks/${block.id}/order`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    blockId: block.id,
                    order_by: previousBlock.order_by
                })
            }
        );

        await fetch(
            `${API_URL}/api/teacher/exams/${exam.id}/blocks/${previousBlock.id}/order`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    blockId: previousBlock.id,
                    order_by: block.order_by
                })
            }
        );

        onChanged();
    };

    const moveDown = async (block) => {

        const nextBlock = exam.blocks
            .filter(b => b.order_by > block.order_by)
            .sort((a, b) => a.order_by - b.order_by)[0];

        if (!nextBlock) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/${exam.id}/blocks/${block.id}/order`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    blockId: block.id,
                    order_by: nextBlock.order_by
                })
            }
        );

        await fetch(
            `${API_URL}/api/teacher/exams/${exam.id}/blocks/${nextBlock.id}/order`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    blockId: nextBlock.id,
                    order_by: block.order_by
                })
            }
        );

        onChanged();
    };

    const canMoveUp = exam.blocks.some(
        b => b.order_by < block.order_by
    );

    const canMoveDown = exam.blocks.some(
        b => b.order_by > block.order_by
    );

    return (
        <div className="card">

            <div className="flex justify-between items-center mb-4">

                <h3 className="text-xl font-semibold">
                    {block.order_by}. {block.name}
                </h3>

            </div>

            <div className="space-y-4">

                {block.questions.map(question => (
                    <Question
                        key={question.id}
                        question={question}
                        onChanged={onChanged}
                        editMode={editMode}
                    />
                ))}

            </div>

            {!editMode && (
                <div className="mt-6 border-t pt-4">

                    <div
                        className="
                            mb-2
                            p-3
                            bg-gray-50
                            rounded-lg
                        "
                        dangerouslySetInnerHTML={{
                            __html: formatValue(newQuestion)
                        }}
                    />

                    <textarea
                        rows={3}
                        className="
                            input-standard
                            resize-y
                            mb-2
                        "
                        value={newQuestion}
                        placeholder="Ny fråga..."
                        onChange={(e) =>
                            setNewQuestion(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                createQuestion();
                            }
                        }}
                    />

                    <Button
                        className="btn-primary"
                        onClick={createQuestion}
                    >
                        Lägg till fråga
                    </Button>

                </div>
            )}

            {editMode && (
                <div className="flex gap-2 mt-4">

                    {canMoveUp && (
                        <Button
                            className="btn-action"
                            onClick={() => moveUp(block)}
                        >
                            Flytta upp
                        </Button>
                    )}

                    {canMoveDown && (
                        <Button
                            className="btn-action"
                            onClick={() => moveDown(block)}
                        >
                            Flytta ner
                        </Button>
                    )}

                    <Button
                        className="btn-action"
                        onClick={() => renameBlock(block)}
                    >
                        Byt namn
                    </Button>

                    <Button
                        className="btn-danger"
                        onClick={() => deleteBlock(block)}
                    >
                        Ta bort block
                    </Button>

                </div>
            )}

        </div>


    )    
}
