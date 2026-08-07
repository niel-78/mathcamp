import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import QuestionCard from "@/components/ui/QuestionCard";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";    

export default function QuestionCardTab({
    questionId,
    tabId,
    closeTab
}) {

    const [question,
        setQuestion] =
        useState(null);

    useEffect(() => {

        loadQuestion();

    }, [questionId]);

    const loadQuestion = async () => {

        try {

            const response = await fetch(
                `${API_URL}/api/questions/${questionId}`,
                {
                    headers: authHeaders()
                }
            );

            if (response.status === 404) {

                closeTab(tabId);

                return;
            }

            const data =
                await response.json();

            setQuestion(data);

        } catch (error) {

            console.error(error);

        }

    };

    if (!question) {
        return <p>Laddar...</p>;
    }

    return (

        <BaseTabLayout
            title={`Uppgift #${question.id}`}
        >

            <QuestionCard
                question={question}
                onChanged={loadQuestion}
            />

        </BaseTabLayout>

    );
}
