import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button }
    from "@/components/ui/button";

import MathContent
    from "@/components/ui/MathContent";

export default function ExamPreview({
    groupExamId
}) {

    const [preview,
        setPreview] =
        useState(null);

    const [loading,
        setLoading] =
        useState(false);

    const loadPreview = async () => {

        setLoading(true);

        try {

            const response =
                await fetch(
                    `${API_URL}/api/group-exams/${groupExamId}/preview`,
                    {
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setPreview(data);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadPreview();

    }, [groupExamId]);

    return (

        <div className="space-y-4">

            <div
                className="
                    flex
                    justify-end
                "
            >

                <Button
                    variant="outline"
                    onClick={loadPreview}
                    disabled={loading}
                >
                    {
                        loading
                            ? "Laddar..."
                            : "Simulera nytt prov"
                    }
                </Button>

            </div>

            {preview?.questions?.map(
                (question, index) => (

                    <div
                        key={question.id}
                        className="
                            card
                            space-y-4
                        "
                    >

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Fråga {index + 1}
                        </div>

                        <MathContent
                            value={
                                question.question
                            }
                        />

                        <div
                            className="
                                space-y-2
                            "
                        >

                            {question.options?.map(
                                option => (

                                    <div
                                        key={option.id}
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                        "
                                    >

                                        <input
                                            type="radio"
                                            disabled
                                        />

                                        <MathContent
                                            value={
                                                option.text
                                            }
                                        />

                                    </div>

                                )
                            )}

                        </div>

                    </div>

                )
            )}

        </div>

    );

}