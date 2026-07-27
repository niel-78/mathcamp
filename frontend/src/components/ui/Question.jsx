import {  useEffect, useState, useRef } from "react";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import { formatValue } from "@/utils/formatValue";
import { formatQuestion } from "@/utils/formatQuestion";
import OptionList from "@/components/ui/OptionList";

export default function Question({ question, onChanged, editMode }) {
    const [newOption, setNewOption] = useState("");
    const [newOptionCorrect, setNewOptionCorrect] = useState(true);
    const [questionText, setQuestionText] = useState(question.question);
    const optionRef = useRef(null);

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
                    Authorization: authHeaders
                }
            }
        );

        onChanged();
    };

    const createOption = async () => {

        if (!newOption.trim()) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/questions/${question.id}/options`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeaders
                },
                body: JSON.stringify({
                    text: newOption,
                    is_correct: newOptionCorrect
                })
            }
        );

        setNewOption("");

        setNewOptionCorrect(false)

        onChanged();

        setTimeout( () => {
            optionRef.current?.focus();
            optionRef.current?.select();
        }, 0)
    };

    const uploadMedia = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            `${API_URL}/api/teacher/exams/questions/${question.id}/media`,
            {
                method: "POST",
                headers: {
                    Authorization: localStorage.getItem("token")
                },
                body: formData
            }
        );

        if (response.ok) {
            onChanged();
        }
    };

    const deleteMedia = async (mediaId) => {

        console.log("DELETE MEDIA", mediaId);

        if (!window.confirm("Ta bort filen?")) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/media/${mediaId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            }
        );

        onChanged();
    };


    return (

        <div className="card">

            <div className="space-y-4">

                <div className="space-y-2">

                    {editMode && (
                        <input
                            className="input-standard"
                            type="file"
                            accept="image/*,video/*"
                            onChange={uploadMedia}
                        />
                    )}

                </div>

                {editMode ? (

                    <div>

                        <div
                            className="math-content"
                            dangerouslySetInnerHTML={{
                                __html: formatQuestion(
                                    questionText
                                )
                            }}
                        />

                        <textarea
                            rows={3}
                            className="input-standard"
                            value={questionText}
                            onChange={(e) =>
                                setQuestionText(
                                    e.target.value
                                )
                            }
                            onBlur={() =>
                                saveQuestion(
                                    questionText
                                )
                            }
                        />

                    </div>

                ) : (

                    <div
                        className="math-content"
                        dangerouslySetInnerHTML={{
                            __html: formatQuestion(
                                question.question
                            )
                        }}
                    />

                )}

                <OptionList
                    options={question.options}
                    onChanged={onChanged}
                    editMode={editMode}
                />

                {!editMode && (

                    <div className="border-t pt-4">

                        <div
                            className="math-content"
                            dangerouslySetInnerHTML={{
                                __html: formatValue(
                                    newOption
                                )
                            }}
                        />

                        <label className="flex items-center gap-2 mb-2">

                            <input
                                type="checkbox"
                                checked={newOptionCorrect}
                                onChange={(e) =>
                                    setNewOptionCorrect(
                                        e.target.checked
                                    )
                                }
                            />

                            <span>
                                Rätt svar
                            </span>

                        </label>

                        <textarea
                            rows={3}
                            ref={optionRef}
                            className="
                                input-standard
                                mb-2
                            "
                            placeholder="Nytt alternativ..."
                            value={newOption}
                            onChange={(e) =>
                                setNewOption(
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter"
                                ) {
                                    createOption();
                                }
                            }}
                        />

                        <div className="flex gap-2">

                            <button
                                className="btn-primary"
                                onClick={createOption}
                            >
                                Lägg till alternativ
                            </button>

                            <button
                                className="btn-danger"
                                onClick={deleteQuestion}
                            >
                                Ta bort fråga
                            </button>

                        </div>

                    </div>

                )}

            </div>

        </div>
    )    
}
