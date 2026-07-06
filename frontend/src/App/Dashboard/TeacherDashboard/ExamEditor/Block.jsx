import { useState } from "react";
import Question from "./Block/Question";
import { authHeaders } from "../../../../api/authHeaders";
import { API_URL } from "../../../../config";

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
                headers: {
                    Authorization: localStorage.getItem("token")
                }
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
                    Authorization: localStorage.getItem("token")
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

        await fetch(
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

        setNewQuestion("");

        onChanged();
    };


    return (
        <div>
            <h3>{block.name}</h3>

            {block.questions.map(question => (
                <Question
                    key={question.id}
                    question={question}
                    onChanged={onChanged}
                    editMode={editMode}
                />

            ))}

            <div>
                <input
                    value={newQuestion}
                    placeholder="Ny fråga..."
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            createQuestion();
                        }
                    }}
                />

                <button onClick={createQuestion}>
                    Lägg till fråga
                </button>
            </div>

            <button onClick={() => renameBlock(block)}>
                Byt namn
            </button>

            <button onClick={() => deleteBlock(block)}>
                Ta bort block
            </button>

        </div>
    );
}
