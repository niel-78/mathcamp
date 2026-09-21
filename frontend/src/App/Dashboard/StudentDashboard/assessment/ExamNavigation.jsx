import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

export default function ExamNavigation({
    index,
    total,
    allowPrevious,
    showReset,
    onPrev,
    onNext,
    onReset,
    onSubmit
}) {

    const isFirst = index === 0;
    const isLast = index === total - 1;

    return (
        <div className="flex items-center justify-between mt-6">

            <div>
                {allowPrevious && (
                    <Button
                        onClick={onPrev}
                        disabled={isFirst}
                        variant="outline"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                        Föregående
                    </Button>
                )}
            </div>

            <div>
                {showReset && (
                    <Button
                        onClick={onReset}
                        variant="secondary"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                        Återställ
                    </Button>
                )}
            </div>

            <div>
                <Button
                    onClick={
                        isLast
                            ? onSubmit
                            : onNext
                    }
                >
                    {isLast ? (
                        "Lämna in prov"
                    ) : (
                        <>
                            Nästa
                            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}