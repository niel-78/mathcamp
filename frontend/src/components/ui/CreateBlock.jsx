import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import MathContent from "@/components/ui/MathContent";
import { QUESTION_TYPES } from "@/constants/assessmentConstants";

const CALCULABLE_QUESTION_TYPES = [
    QUESTION_TYPES.NUMERIC_INPUT,
    QUESTION_TYPES.EQUATION,
    QUESTION_TYPES.LINEAR_SYSTEM,
    QUESTION_TYPES.EXPRESSION,
    QUESTION_TYPES.FACTORIZATION,
    QUESTION_TYPES.TEXT
];

export default function CreateBlock({
    centralContentIds = [],
    sectionIds = [],
    assessmentId,
    onCreated
}) {

    const [question, setQuestion] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [levels, setLevels] = useState([]);
    const [questionType, setQuestionType] = useState("numeric_input");
    const [levelId, setLevelId] = useState("");
    const [calculatorAllowed, setCalculatorAllowed] = useState(false);
    const [geogebraAllowed, setGeogebraAllowed] = useState(false);
    const [calculateAnswers, setCalculateAnswers] = useState(true);

    const questions = question
        .split(";")
        .map(value => value.trim())
        .filter(Boolean);

    useEffect(() => {
        const loadLevels = async () => {
            const response = await fetch(
                `${API_URL}/api/question-levels`,
                { headers: authHeaders() }
            );

            if (response.ok) {
                setLevels(await response.json());
            }
        };

        loadLevels();
    }, []);

    const createBlock = async () => {

        if (questions.length === 0) {
            return;
        }

        setIsSaving(true);

        try {

            const response = await fetch(
                `${API_URL}/api/blocks`,
                {
                    method: "POST",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        questions,
                        questionType,
                        levelId: levelId || null,
                        calculatorAllowed,
                        geogebraAllowed,
                        calculateAnswers,
                        centralContentIds,
                        sectionIds,
                        assessmentId
                    })
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Kunde inte skapa block."
                );
            }

            setQuestion("");

            await onCreated?.();

        } finally {

            setIsSaving(false);

        }

    };

    return (
        <div className="mb-6">

            <div className="space-y-4">
                <Textarea
                    value={question}
                    onChange={(e) =>
                        setQuestion(e.target.value)
                    }
                    rows={4}
                    placeholder="Skriv frågor med ; mellan varje fråga"
                />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="space-y-1 text-sm">
                        <span>Frågetyp</span>
                        <select
                            className="input-standard w-full"
                            value={questionType}
                            onChange={(event) => setQuestionType(event.target.value)}
                        >
                            {CALCULABLE_QUESTION_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Nivå</span>
                        <select
                            className="input-standard w-full"
                            value={levelId}
                            onChange={(event) => setLevelId(event.target.value)}
                        >
                            <option value="">Ingen nivå</option>
                            {levels.map(level => (
                                <option key={level.id} value={level.id}>
                                    {level.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <BooleanSwitch
                        id="calculate-answers"
                        label="Beräkna facit"
                        value={calculateAnswers}
                        onChange={setCalculateAnswers}
                    />
                    <BooleanSwitch
                        id="calculator-allowed"
                        label="Miniräknare tillåten"
                        value={calculatorAllowed}
                        onChange={setCalculatorAllowed}
                    />
                    <BooleanSwitch
                        id="geogebra-allowed"
                        label="GeoGebra tillåten"
                        value={geogebraAllowed}
                        onChange={setGeogebraAllowed}
                    />
                </div>

                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                        {questions.length} {questions.length === 1 ? "fråga" : "frågor"}
                    </span>
                    <Button
                        onClick={createBlock}
                        disabled={isSaving || questions.length === 0}
                    >
                        {isSaving ? "Skapar..." : "Skapa"}
                    </Button>
                </div>

            </div>

            {question.trim() && (

                <div className="mt-4 rounded border p-4">

                    <p className="mb-2 text-sm text-muted-foreground">
                        Förhandsvisning
                    </p>

                    <div className="space-y-3">
                        {questions.map((value, index) => (
                            <div key={`${value}-${index}`} className="flex gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {index + 1}.
                                </span>
                                <MathContent value={value} />
                            </div>
                        ))}
                    </div>

                </div>

            )}

        </div>
    );
}

function BooleanSwitch({ id, label, value, onChange }) {
    return (
        <div className="flex min-h-10 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
            <label htmlFor={id}>{label}</label>
            <Switch
                id={id}
                checked={value}
                onCheckedChange={onChange}
            />
        </div>
    );
}