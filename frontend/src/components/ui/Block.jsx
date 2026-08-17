import { useState } from "react";
import { authHeaders } from "@/api/authHeaders";
import MathContent from "@/components/ui/MathContent";
import { API_URL } from "@/config";
import Question from "./Block/Question";

export default function Block({ block, assessment, onChanged, editMode }) {
    const [newQuestion, setNewQuestion] = useState("");

    const deleteBlock = async (block) => {

        const confirmed = window.confirm(
            `Ta bort blocket "${block.name}"?`
        );

        if (!confirmed) {
            return;
        }

        await fetch(
            `${API_URL}/api/assessments/${assessment.id}/blocks/${block.id}`,
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
            `${API_URL}/api/assessments/blocks/${block.id}`,
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
            `${API_URL}/api/assessments/blocks/${block.id}/questions`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: newQuestion,
                    type: 1,
                    answer_config: {
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

        const previousBlock = assessment.blocks
            .filter(b => b.sort_order < block.sort_order)
            .sort((a, b) => b.sort_order - a.sort_order)[0];

        if (!previousBlock) {
            return;
        }

        await fetch(
            `${API_URL}/api/assessments/${assessment.id}/blocks/${block.id}/order`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    blockId: block.id,
                    sort_order: previousBlock.sort_order
                })
            }
        );

        await fetch(
            `${API_URL}/api/assessments/${assessment.id}/blocks/${previousBlock.id}/order`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    blockId: previousBlock.id,
                    sort_order: block.sort_order
                })
            }
        );

        onChanged();
    };

    const moveDown = async (block) => {

        const nextBlock = assessment.blocks
            .filter(b => b.sort_order > block.sort_order)
            .sort((a, b) => a.sort_order - b.sort_order)[0];

        if (!nextBlock) {
            return;
        }

        await fetch(
            `${API_URL}/api/assessments/${assessment.id}/blocks/${block.id}/order`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    blockId: block.id,
                    sort_order: nextBlock.sort_order
                })
            }
        );

        await fetch(
            `${API_URL}/api/assessments/${assessment.id}/blocks/${nextBlock.id}/order`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    blockId: nextBlock.id,
                    sort_order: block.sort_order
                })
            }
        );

        onChanged();
    };

    const canMoveUp = assessment.blocks.some(
        b => b.sort_order < block.sort_order
    );

    const canMoveDown = assessment.blocks.some(
        b => b.sort_order > block.sort_order
    );

    return (
        <div className="card">

            <div className="flex justify-between items-center mb-4">

                <h3 className="text-xl font-semibold">
                    {block.sort_order}. {block.name}
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
                    >
                        <MathContent value={newQuestion} />
                    </div>    
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
                            onClick={() => moveUp(block)}
                        >
                            Flytta upp
                        </Button>
                    )}

                    {canMoveDown && (
                        <Button
                            onClick={() => moveDown(block)}
                        >
                            Flytta ner
                        </Button>
                    )}

                    <Button
                        onClick={() => renameBlock(block)}
                    >
                        Byt namn
                    </Button>

                    <Button
                        onClick={() => deleteBlock(block)}
                    >
                        Ta bort block
                    </Button>

                </div>
            )}

        </div>


    )    
}
