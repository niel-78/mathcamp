import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";

export default function SingleChoiceQuestion({
    question,
    value,
    questionTextClassName = "text-base",
    onChange
}) {

    return (
        <>
            <MathContent
                value={question.question}
                className={`${questionTextClassName} mb-7 block text-left font-medium`}
            />

            <div className="assessment_answers flex flex-col items-start gap-3 text-left">

                {question.options?.map(opt => (

                    <Button
                        key={opt.id}
                        variant={
                            Number(value) === Number(opt.id)
                                ? "default"
                                : "outline"
                            }
                            className="h-auto min-h-12 w-full max-w-2xl justify-start whitespace-normal px-4 py-3 text-left text-lg"
                            onClick={() => {
                                onChange(opt.id)
                            }}
                    >

                        <MathContent value={opt.text} />

                    </Button>

                ))}

            </div>
        </>
    );
}
