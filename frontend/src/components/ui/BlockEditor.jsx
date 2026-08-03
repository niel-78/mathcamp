import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import QuestionView from "@/components/ui/QuestionView";

export default function BlockEditor({
    block,
    editMode,
    onChanged,
}) {

    const [currentBlock, setCurrentBlock] = useState(block);    

    useEffect(() => {
        setCurrentBlock(block);
    }, [block]);

    const loadBlock = async () => {

        const response = await fetch(
            `${API_URL}/api/blocks/${block.id}/`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        setCurrentBlock(data);

    };

    const createQuestion = async () => {

        const lastQuestion =
            currentBlock.questions[
                currentBlock.questions.length - 1
            ];

        const response = await fetch(
            `${API_URL}/api/blocks/${currentBlock.id}/questions`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: lastQuestion?.question ?? "",
                    type: lastQuestion?.type ?? 1,
                    math_config:
                        lastQuestion?.math_config ??
                        {}
                })
            }
        );

        if (!response.ok) {

            const text = await response.text();

            console.error(text);

            return;
        }

        const data = await response.json();

        await loadBlock();

        setEditingQuestionId(data.id);

    };

    return (
        <div className="block-editor">

            {currentBlock?.questions.map(question => (

                <QuestionView
                    key={question.id}
                    question={question}
                    onChanged={loadBlock}
                />

            ))}

            <Button onClick={createQuestion}>
                Ny fråga
            </Button>

        </div>
    );

}