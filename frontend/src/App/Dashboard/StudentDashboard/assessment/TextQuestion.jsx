import { useEffect, useState } from "react";
import MathContent from "@/components/ui/MathContent";
import { Input } from "@/components/ui/input";
import MathPreview from "@/components/ui/MathPreview";

export default function TextQuestion({
    question,
    value,
    onBlur
}) {

    const [text, setText] = useState(value || "");

    useEffect(() => {
        setText(value || "");
    }, [question.id, value]);

    return (
        <>
            <h2>
                Fråga {question.sort_order}
            </h2>

            <MathContent value={question.question} />

            <MathPreview value={text} />


            <Input
                type="text"
                className="answer-input"
                value={text}
                onChange={e =>
                    setText(e.target.value)
                }
                onBlur={e =>
                    onBlur(e.target.value)
                }
            />
        </>
    );
}