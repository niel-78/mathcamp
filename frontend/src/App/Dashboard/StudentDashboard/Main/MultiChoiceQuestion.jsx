import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";

export default function MultiChoiceQuestion({
    question,
    value = [],
    onChange
}) {

    console.log("MultiChoiceQuestion");
    console.log(question);
    console.log(value);

    return (
        <>
            <h2>
                Fråga {question.sort_order}
            </h2>

            <MathContent value={question.question} />

            <div className="answers">

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