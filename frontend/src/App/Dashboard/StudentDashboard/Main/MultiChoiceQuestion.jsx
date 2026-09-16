import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";

export default function MultiChoiceQuestion({
    question,
    value = [],
    questionTextClassName = "text-base",
    onChange
}) {

    return (
        <>
            <h2>
                Fråga {question.sort_order}
            </h2>

            <MathContent
                value={question.question}
                className={questionTextClassName}
            />

            <div className="assessment_answers flex flex-wrap gap-2">

                {question.options?.map(opt => (

                    <Button
                        key={opt.id}
                        variant={
                            value?.includes(opt.id)
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                            onChange(opt.id)
                        }
                    >

                        <MathContent value={opt.text} />

                    </Button>

                ))}

            </div>
        </>
    );
}