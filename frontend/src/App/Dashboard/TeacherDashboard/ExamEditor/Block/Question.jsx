import {  useEffect, useState } from "react";
import OptionList from "./Question/OptionList";
import { authHeaders } from "../../../../../api/authHeaders";
import { API_URL } from "../../../../../config";
import { formatValue } from "../../../../../utils/formatValue";
import { formatQuestion } from "../../../../../utils/formatQuestion";
import { isMathExpression } from "../../../../../utils/isMathExpression";
import "./Question.css";

export default function Question({ question, onChanged, editMode }) {
    const [newOption, setNewOption] = useState("");
    const [newOptionCorrect, setNewOptionCorrect] = useState(false);
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
                    is_correct: newOptionCorrect
                })
            }
        );

        setNewOption("");

        setNewOptionCorrect(false)

        onChanged();
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
        <div className="question">

            <div className="question-media-list">

                {question.media?.map((m) => (
                    <div key={m.id} className="question-media">
                        {m.media_type === "image" ? (
                            <img
                                src={`${API_URL}${m.media_url}`}
                                alt=""
                                style={{maxWidth:"50%",
                                        maxHeight:"50%",
                                        objectFit: "contain"
                                    }}

                            >
                            </img>
                        ) : (<p>Not image</p>)}

                    {editMode && (
                        <button
                            onClick={ () =>
                                    deleteMedia(m.id)
                            }
                        >
                            Ta bort media
                        </button>    
                    )}

                        </div>
                    ))}

                {editMode && (
                    <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={uploadMedia}
                    />
                )}        
            </div>    

            {
                editMode ? (
                    <div className="question-text">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: formatQuestion(questionText)
                            }}
                        />
                        <textarea
                            rows={3}
                            value={questionText}
                            onChange={(e) =>
                                setQuestionText(e.target.value)
                            }
                            onBlur={() =>
                                saveQuestion(questionText)
                            }
                        />
                    </div>

                ) : (
                    <div 
                        className="question-text"
                        dangerouslySetInnerHTML={{
                            __html: formatQuestion(question.question)
                        }}
                    />    
                )
            }

            <OptionList
                options={question.options}
                onChanged={onChanged}
                editMode={editMode}
            />

            {editMode && (
                <div className="question-options">

                    <div
                        dangerouslySetInnerHTML={{
                            __html: formatValue(newOption)
                        }}
                    />

                    <input 
                        type="checkbox"
                        checked={newOptionCorrect}
                        onChange={ (e) => 
                            setNewOptionCorrect(e.target.checked)
                        }
                    />   
                    <textarea
                        rows={3}
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

                    <div className="buttons">    

                        <button onClick={createOption}>
                            Lägg till alternativ
                        </button>

                        <button onClick={deleteQuestion}>
                            Ta bort fråga
                        </button>
                    </div>        

                </div>
            )}        
            
        </div>
    );
}
