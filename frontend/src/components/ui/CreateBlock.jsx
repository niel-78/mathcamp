import { useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";

export default function CreateBlock({
    centralContentIds = [],
    sectionIds = [],
    examId,
    onCreated
}) {

    const [question, setQuestion] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const createBlock = async () => {

        if (!question.trim()) {
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
                        question,
                        centralContentIds,
                        sectionIds,
                        examId
                    })
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Kunde inte skapa block."
                );
            }

            const data = await response.json();

            setQuestion("");

            await onCreated?.();

        } finally {

            setIsSaving(false);

        }

    };

    return (
        <div className="mb-6">

            <div className="flex gap-2">

                <Input
                    value={question}
                    onChange={(e) =>
                        setQuestion(e.target.value)
                    }
                    onKeyDown={(e) => {

                        if (e.key === "Enter") {
                            createBlock();
                        }

                    }}
                    placeholder="Skriv första frågan..."
                />

                <Button
                    onClick={createBlock}
                    disabled={isSaving}
                >
                    Skapa
                </Button>

            </div>

            {question.trim() && (

                <div className="mt-4 rounded border p-4">

                    <p className="mb-2 text-sm text-muted-foreground">
                        Förhandsvisning
                    </p>

                    <MathContent
                        value={question}
                    />

                </div>

            )}

        </div>
    );
}