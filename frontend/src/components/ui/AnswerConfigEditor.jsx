import { useState } from "react";

import { Button } from "@/components/ui/button";
import { updateQuestion } from "@/api/questionApi";
import { toast } from "sonner";
import {
    GRADING_MODES,
    QUESTION_TYPES,
    getGradingModeLabel,
    getQuestionTypeLabel
} from "@/constants/examConstants";

export default function AnswerConfigEditor({
    question,
    onChanged
}) {

    const config =
        typeof question.answer_config ===
        "string"
            ? JSON.parse(
                question.answer_config
            )
            : (
                question.answer_config || {}
            );

    const [editing, setEditing] =
        useState(false);

    const [questionType, setQuestionType] =
        useState(question.question_type);

    const [gradingMode, setGradingMode] =
        useState(
            config.grading_mode ||
            GRADING_MODES.TEXT.value
        );

    const [defaultAnswer,
        setDefaultAnswer] =
        useState(
            config.default_answer || ""
        );

    const [ignoreVariableNames,
        setIgnoreVariableNames] =
        useState(
            config.ignore_variable_names ??
            false
        );

    const [decimals, setDecimals] =
        useState(
            config.decimals ?? ""
        );

    const [tolerance, setTolerance] =
        useState(
            config.tolerance ?? ""
        );

    const [roundTo, setRoundTo] =
        useState(
            config.round_to ?? ""
        );

    const modeConfig =
        Object.values(GRADING_MODES)
            .find(
                mode =>
                    mode.value === gradingMode
            );

    const saveSettings = async () => {

        try {

        await updateQuestion(
            question.id,
            {
                question:
                    question.question,

                question_type:
                    questionType,

                level_id:
                    question.level_id,

                answer_config: {
                    ...config,
                    grading_mode:
                        gradingMode,
                    default_answer:
                        defaultAnswer,
                    ignore_variable_names:
                        ignoreVariableNames,
                    decimals:
                        decimals,
                    tolerance:
                        tolerance,
                    round_to:
                        roundTo
                }
            }
        );

            await onChanged();

            setEditing(false);

            toast.success(
                "Inställningar sparade"
            );

        } catch (error) {

            console.error(error);

            toast.error(
                "Kunde inte spara"
            );
        }
    };

    const renderSettings = () => {

        return (

            <>

                {modeConfig?.settings.includes(
                    "default_answer"
                ) && (

                    <div>

                        <label>
                            Standardsvar
                        </label>

                        {!editing ? (

                            <div
                                className="
                                    border
                                    rounded
                                    p-2
                                    bg-gray-50
                                "
                            >
                                {defaultAnswer ||
                                    "Saknas"}
                            </div>

                        ) : (

                            <input
                                className="
                                    input-standard
                                    w-full
                                "
                                value={defaultAnswer}
                                onChange={(e) =>
                                    setDefaultAnswer(
                                        e.target.value
                                    )
                                }
                            />

                        )}

                    </div>

                )}

                {modeConfig?.settings.includes(
                    "ignore_variable_names"
                ) && (

                    <div>

                        {!editing ? (

                            <div>

                                <strong>
                                    Ignorera
                                    variabelnamn:
                                </strong>{" "}

                                {ignoreVariableNames
                                    ? "Ja"
                                    : "Nej"}

                            </div>

                        ) : (

                            <label
                                className="
                                    flex
                                    gap-2
                                    items-center
                                "
                            >

                                <input
                                    type="checkbox"
                                    checked={
                                        ignoreVariableNames
                                    }
                                    onChange={(e) =>
                                        setIgnoreVariableNames(
                                            e.target.checked
                                        )
                                    }
                                />

                                Ignorera
                                variabelnamn

                            </label>

                        )}

                    </div>

                )}


                {modeConfig?.settings.includes(
                    "round_to"
                ) && (

                    <div>

                        <label>
                            Avrunda till närmaste
                        </label>

                        {!editing ? (

                            <div
                                className="
                                    border
                                    rounded
                                    p-2
                                    bg-gray-50
                                "
                            >
                                {roundTo === ""
                                    ? "Ej angivet"
                                    : roundTo}
                            </div>

                        ) : (

                            <input
                                type="number"
                                min="1"
                                className="
                                    input-standard
                                    w-full
                                "
                                value={roundTo}
                                onChange={(e) =>
                                    setRoundTo(
                                        e.target.value === ""
                                            ? ""
                                            : Number(
                                                e.target.value
                                            )
                                    )
                                }
                            />

                        )}

                    </div>

                )}



                {modeConfig?.settings.includes(
                    "tolerance"
                ) && (

                    <div>

                        <label>
                            Tolerans
                        </label>

                        {!editing ? (

                            <div
                                className="
                                    border
                                    rounded
                                    p-2
                                    bg-gray-50
                                "
                            >
                                {tolerance === ""
                                    ? "Ej angivet"
                                    : tolerance}
                            </div>

                        ) : (

                            <input
                                type="number"
                                step="0.0001"
                                min="0"
                                className="
                                    input-standard
                                    w-full
                                "
                                value={tolerance}
                                onChange={(e) =>
                                    setTolerance(
                                        e.target.value === ""
                                            ? ""
                                            : Number(
                                                e.target.value
                                            )
                                    )
                                }
                            />

                        )}

                    </div>

                )}



                {modeConfig?.settings.includes(
                    "decimals"
                ) && (

                    <div>

                        <label>
                            Minsta antal
                            korrekta decimaler
                        </label>

                        {!editing ? (

                            <div
                                className="
                                    border
                                    rounded
                                    p-2
                                    bg-gray-50
                                "
                            >
                                {decimals === ""
                                    ? "Ej angivet"
                                    : decimals}
                            </div>

                        ) : (

                            <input
                                type="number"
                                min="0"
                                className="
                                    input-standard
                                    w-full
                                "
                                value={decimals}
                                onChange={(e) =>
                                    setDecimals(
                                        e.target.value === ""
                                            ? ""
                                            : Number(
                                                e.target.value
                                            )
                                    )
                                }
                            />

                        )}

                    </div>

                )}

            </>

        );
    };


    return (

        <div className="border rounded-lg p-4">

            {!editing ? (

                <>

                    <div>
                        <strong>Frågetyp:</strong>{" "}
                        {getQuestionTypeLabel(
                            questionType
                        )}
                    </div>

                    <div>
                        <strong>Rättningsmetod:</strong>{" "}
                        {getGradingModeLabel(
                            gradingMode
                        )}
                    </div>

                    {renderSettings()}

                    <Button
                        className="mt-2"
                        onClick={() =>
                            setEditing(true)
                        }
                    >
                        Redigera
                    </Button>

                </>

            ) : (

                <div className="space-y-4">

                    <div>

                        <label
                            className="
                                text-sm
                                font-medium
                                block
                                mb-1
                            "
                        >
                            Frågetyp
                        </label>

                        <select
                            className="input-standard"
                            value={questionType}
                            onChange={(e) =>
                                setQuestionType(
                                    e.target.value
                                )
                            }
                        >
                            {Object.values(
                                QUESTION_TYPES
                            ).map(type => (

                                <option
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.label}
                                </option>

                            ))}
                        </select>

                    </div>

                    <div>

                        <label
                            className="
                                text-sm
                                font-medium
                                block
                                mb-1
                            "
                        >
                            Rättningsmetod
                        </label>

                        <select
                            className="input-standard"
                            value={gradingMode}
                            onChange={(e) =>
                                setGradingMode(
                                    e.target.value
                                )
                            }
                        >
                            {Object.values(
                                GRADING_MODES
                            ).map(mode => (

                                <option
                                    key={mode.value}
                                    value={mode.value}
                                >
                                    {mode.label}
                                </option>

                            ))}
                        </select>

                    </div>

                    {renderSettings()}

                    <div className="flex gap-2">

                        <Button
                            onClick={saveSettings}
                        >
                            Spara
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() =>
                                setEditing(false)
                            }
                        >
                            Avbryt
                        </Button>

                    </div>

                </div>

            )}

        </div>

    );
}    
