import { Button } from "@/components/ui/button";
import { formatMathText } from "@/utils/formatMathText";

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
                            value?.includes(opt.id)
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                            onChange(opt.id)
                        }
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