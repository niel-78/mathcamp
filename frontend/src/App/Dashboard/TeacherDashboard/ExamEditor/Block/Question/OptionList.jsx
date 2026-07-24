import {  useState } from "react";
import { authHeaders } from "../../../../../../api/authHeaders";
import { API_URL } from "../../../../../../config";
import { formatValue } from "../../../../../../utils/formatValue";
import { formatQuestion } from "../../../../../../utils/formatQuestion";
import { isMathExpression } from "../../../../../../utils/isMathExpression";
import "./OptionList.css";

export default function OptionList({ options, onChanged, editMode }) {
    const [editedOptions, setEditedOptions] = useState({});
    
    const deleteOption = async (optionId) => {

        if (!window.confirm("Ta bort alternativet?")) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/options/${optionId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            }
        );

        onChanged();
    };

    const updateOption = async (
            optionId,
            text,
            is_correct
        ) => {

            await fetch(
                `${API_URL}/api/teacher/exams/options/${optionId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: localStorage.getItem("token")
                    },
                    body: JSON.stringify({
                        text,
                        is_correct
                    })
                }
            );

            onChanged();
        };

    return (
        <div className="options">
            {options.map(option => (
                <div className="option" key={option.id}>
                    
                    {editMode && (
                        <input
                            type="checkbox"
                            checked={option.is_correct}
                            onChange={() =>
                                updateOption(
                                    option.id,
                                    option.text,
                                    !option.is_correct
                                )
                            }
                        />
                    )}    
                    {
                        editMode ? (
                            <div>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: formatQuestion(
                                            editedOptions[option.id] ?? option.text
                                        )
                                    }}
                                />
                                <textarea
                                    rows={3}
                                    value={
                                        editedOptions[option.id] ?? option.text
                                    }
                                    onChange={(e) =>
                                        setEditedOptions({
                                            ...editedOptions,
                                            [option.id]: e.target.value
                                        })
                                    }
                                    onBlur={() =>
                                        updateOption(
                                            option.id,
                                            editedOptions[option.id] ?? option.text,
                                            option.is_correct
                                        )
                                    }
                                />
                            </div>
                        ) : (
                            <div>
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: formatValue(option.text)
                                    }}
                                />
                                {option.is_correct && (" (korrekt)")}
                            </div>    
                        )
                    }

                    {editMode && (
                        <button onClick={() => deleteOption(option.id)}>
                            Ta bort alternativ
                        </button>
                    )}         
                </div>
            ))}
        </div>
    );
}
