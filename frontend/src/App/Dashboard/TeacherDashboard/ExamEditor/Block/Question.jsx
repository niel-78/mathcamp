import {  useEffect, useState } from "react";
import OptionList from "./Question/OptionList";
import { authHeaders } from "../../../../../api/authHeaders";
import { API_URL } from "../../../../../config";
import { formatValue } from "../../../../../utils/formatValue";
import { formatQuestion } from "../../../../../utils/formatQuestion";
import { isMathExpression } from "../../../../../utils/isMathExpression";

export default function Question({ question, onChanged, editMode }) {
    const [newOption, setNewOption] = useState("");
    const [questionText, setQuestionText] = useState(question.question);

    useEffect(() => {
        setQuestionText(question.question);
    }, [question.question]);


    const saveQuestion = async (value) => {

        await fetch(
            `${API_URL}/api/teacher/exams/questions/${question.id}`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: value,
                    type: question.type,
                    math_config: question.math_config
                })
            }
        );

        onChanged();
    };


    const deleteQuestion = async () => {

        const confirmed = window.confirm(
            "Är du säker på att du vill ta bort frågan?"
        );

        if (!confirmed) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/questions/${question.id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            }
        );

        onChanged();
    };

    const createOption = async () => {

        console.log(newOption)

        if (!newOption.trim()) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/questions/${question.id}/options`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: localStorage.getItem("token")
                },
                body: JSON.stringify({
                    text: newOption,
                    is_correct: false
                })
            }
        );

        setNewOption("");

        onChanged();
    };


    return (
        <div>

            {
                editMode ? (
                    <input
                        value={questionText}
                        onChange={(e) =>
                            setQuestionText(e.target.value)
                        }
                        onBlur={() =>
                            saveQuestion(questionText)
                        }
                    />
                ) : (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: formatQuestion(question.question)
                        }}
                    />
                )
            }


            <OptionList
                options={question.options}
                onChanged={onChanged}
            />


            <input
                type="text"
                placeholder="Nytt alternativ..."
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        createOption();
                    }
                }}
            />

            <button onClick={createOption}>
                Lägg till alternativ
            </button>

            <button onClick={deleteQuestion}>
                Ta bort fråga
            </button>

        </div>
    );
}
