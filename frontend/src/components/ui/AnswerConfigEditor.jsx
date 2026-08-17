import { useState } from "react";

import { Button } from "@/components/ui/button";
import { updateQuestion } from "@/api/questionApi";
import { toast } from "sonner";
import {
    GRADING_MODES,
    QUESTION_TYPES,
    getGradingModeLabel,
    getQuestionTypeLabel
} from "@/constants/assessmentConstants";

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

    const [
        requireSimplified,
        setRequireSimplified
    ] = useState(
        config.require_simplified ??
        false
    );

    const [
        allowDecimal,
        setAllowDecimal
    ] = useState(
        config.allow_decimal ?? false
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
                        roundTo,
                    require_simplified:
                        requireSimplified,
                    allow_decimal:
                        allowDecimal
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

    function Field({
        label,
        children
    }) {

        return (

            <div
                className="
                    grid
                    grid-cols-[140px_1fr]
                    items-start
                    gap-4
                "
            >

                <label
                    className="
                        text-sm
                        font-medium
                        pt-2
                    "
                >
                    {label}
                </label>

                <div>
                    {children}
                </div>

            </div>

        );

    }

    const renderSettings = () => {

        return (

            <>

                {modeConfig?.settings.includes(
                    "default_answer"
                ) && (

                    <Field
                        label="Standardsvar"
                    >

                        {!editing ? (

                            <div
                                className="
                                    border
                                    rounded
                                    p-2
                                    bg-muted
                                "
                            >
                                {
                                    defaultAnswer ||
                                    "Saknas"
                                }
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

                    </Field>

                )}

                {modeConfig?.settings.includes(
                    "ignore_variable_names"
                ) && (

                    <Field label="">

                        {!editing ? (

                            <div>
                                <strong>
                                    Ignorera variabelnamn:
                                </strong>
                                {" "}
                                {
                                    ignoreVariableNames
                                        ? "Ja"
                                        : "Nej"
                                }
                            </div>

                        ) : (

                            <label
                                className="
                                    flex
                                    items-center
                                    gap-2
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

                                Ignorera variabelnamn

                            </label>

                        )}

                    </Field>

                )}

                {modeConfig?.settings.includes(
                    "round_to"
                ) && (

                    <Field
                        label="Avrunda till"
                    >

                        {!editing ? (

                            <div
                                className="
                                    border
                                    rounded
                                    p-2
                                    bg-muted
                                "
                            >
                                {
                                    roundTo === ""
                                        ? "Ej angivet"
                                        : roundTo
                                }
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

                    </Field>

                )}

                {modeConfig?.settings.includes(
                    "require_simplified"
                ) && (

                    <Field label="">

                        {!editing ? (

                            <div>
                                <strong>
                                    Förenklat bråk:
                                </strong>
                                {" "}
                                {
                                    requireSimplified
                                        ? "Ja"
                                        : "Nej"
                                }
                            </div>

                        ) : (

                            <label
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <input
                                    type="checkbox"
                                    checked={
                                        requireSimplified
                                    }
                                    onChange={(e) =>
                                        setRequireSimplified(
                                            e.target.checked
                                        )
                                    }
                                />

                                Kräv maximalt förenklat bråk

                            </label>

                        )}

                    </Field>

                )}

                {modeConfig?.settings.includes(
                    "allow_decimal"
                ) && (

                    <Field label="">

                        {!editing ? (

                            <div>
                                <strong>
                                    Tillåt decimalform:
                                </strong>
                                {" "}
                                {
                                    allowDecimal
                                        ? "Ja"
                                        : "Nej"
                                }
                            </div>

                        ) : (

                            <label
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <input
                                    type="checkbox"
                                    checked={
                                        allowDecimal
                                    }
                                    onChange={(e) =>
                                        setAllowDecimal(
                                            e.target.checked
                                        )
                                    }
                                />

                                Tillåt decimalform

                            </label>

                        )}

                    </Field>

                )}

                {modeConfig?.settings.includes(
                    "tolerance"
                ) && (

                    <Field
                        label="Tolerans"
                    >

                        {!editing ? (

                            <div
                                className="
                                    border
                                    rounded
                                    p-2
                                    bg-muted
                                "
                            >
                                {
                                    tolerance === ""
                                        ? "Ej angivet"
                                        : tolerance
                                }
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

                    </Field>

                )}

                {modeConfig?.settings.includes(
                    "decimals"
                ) && (

                    <Field
                        label="Decimaler"
                    >

                        {!editing ? (

                            <div
                                className="
                                    border
                                    rounded
                                    p-2
                                    bg-muted
                                "
                            >
                                {
                                    decimals === ""
                                        ? "Ej angivet"
                                        : decimals
                                }
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

                    </Field>

                )}

            </>

        );

    };


    return (

        <div className="space-y-4">

            {!editing ? (

                <div className="space-y-3">

                    <Field
                        label="Frågetyp"
                    >
                        <div>
                            {
                                getQuestionTypeLabel(
                                    questionType
                                )
                            }
                        </div>
                    </Field>

                    {questionType ===
                        QUESTION_TYPES.TEXT.value && (

                        <>

                            <Field
                                label="Rättningsmetod"
                            >
                                <div>
                                    {
                                        getGradingModeLabel(
                                            gradingMode
                                        )
                                    }
                                </div>
                            </Field>

                            {renderSettings()}

                        </>

                    )}

                    <div
                        className="
                            flex
                            justify-end
                        "
                    >

                        <Button
                            onClick={() =>
                                setEditing(true)
                            }
                        >
                            Redigera
                        </Button>

                    </div>

                </div>

            ) : (

                <div className="space-y-4">

                    <Field
                        label="Frågetyp"
                    >

                        <select
                            className="
                                input-standard
                            "
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

                    </Field>

                    {questionType ===
                        QUESTION_TYPES.TEXT.value && (

                        <>

                            <Field
                                label="Rättningsmetod"
                            >

                                <select
                                    className="
                                        input-standard
                                    "
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

                            </Field>

                            {renderSettings()}

                        </>

                    )}

                    <div
                        className="
                            flex
                            justify-end
                            gap-2
                        "
                    >

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
