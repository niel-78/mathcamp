import {  useState } from "react";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import { formatValue } from "@/utils/formatValue";
import { formatQuestion } from "@/utils/formatQuestion";

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
                    Authorization: authHeaders
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
                        Authorization: authHeaders
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
        <div className="space-y-3">

            {options.map(option => (

                <div
                    key={option.id}
                    className="
                        border
                        rounded-lg
                        p-4
                        bg-white
                    "
                >

                    {editMode && (
                        <label className="flex items-center gap-2 mb-2">

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

                            <span>
                                Rätt svar
                            </span>

                        </label>
                    )}

                    {editMode ? (

                        <div>

                            <div
                                className="
                                    math-preview
                                    mb-2
                                "
                                dangerouslySetInnerHTML={{
                                    __html: formatQuestion(
                                        editedOptions[option.id] ??
                                        option.text
                                    )
                                }}
                            />

                            <textarea
                                rows={3}
                                className="input-standard"
                                value={
                                    editedOptions[option.id] ??
                                    option.text
                                }
                                onChange={(e) =>
                                    setEditedOptions({
                                        ...editedOptions,
                                        [option.id]:
                                            e.target.value
                                    })
                                }
                                onBlur={() =>
                                    updateOption(
                                        option.id,
                                        editedOptions[option.id] ??
                                        option.text,
                                        option.is_correct
                                    )
                                }
                            />

                        </div>

                    ) : (

                        <div className="flex gap-2 items-start">

                            <div
                                className="math-content flex-1"
                                dangerouslySetInnerHTML={{
                                    __html: formatValue(
                                        option.text
                                    )
                                }}
                            />

                            {option.is_correct ? 
                                <span
                                    className="
                                        bg-green-100
                                        text-green-800
                                        text-sm
                                        px-2
                                        py-1
                                        rounded
                                    "
                                >
                                    Korrekt
                                </span>
                                :
                                <span
                                    className="
                                        bg-red-100
                                        text-red-800
                                        text-sm
                                        px-2
                                        py-1
                                        rounded
                                    "
                                >
                                    Felaktigt
                                </span>
                            }

                        </div>

                    )}

                    {editMode && (

                        <div className="mt-3">

                            <button
                                className="btn-danger"
                                onClick={() =>
                                    deleteOption(option.id)
                                }
                            >
                                Ta bort alternativ
                            </button>

                        </div>

                    )}

                </div>

            ))}

        </div>
        
    )    
}
