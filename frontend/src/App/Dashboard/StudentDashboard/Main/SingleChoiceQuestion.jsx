import { Button } from "@/components/ui/button";
import { formatMathText } from "@/utils/formatMathText";

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

            <div
                dangerouslySetInnerHTML={{
                    __html: formatMathText(
                        question.question
                    )
                }}
            />

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
                        <div
                            dangerouslySetInnerHTML={{
                                __html: formatMathText(
                                    opt.text
                                )
                            }}
                        />

                    </Button>

                ))}

            </div>
        </>
    );
}
