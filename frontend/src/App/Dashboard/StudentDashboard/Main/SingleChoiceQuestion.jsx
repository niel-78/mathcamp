import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";

export default function SingleChoiceQuestion({
    question,
    value,
    onChange
}) {

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
                            Number(value) === Number(opt.id)
                                ? "default"
                                : "outline"
                            }
                            onClick={() => {
                                console.log("BUTTON CLICK", opt.id);
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
