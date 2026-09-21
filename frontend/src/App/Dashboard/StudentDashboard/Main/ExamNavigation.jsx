import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

export default function ExamNavigation({
    index,
    total,
    allowPrevious,
    showReset,
    timeExpired,
    onPrev,
    onNext,
    onReset,
    onSubmit,
    softEnded = false,
    allowSubmitAfterSeed = false,
    isSeedPhase = false,
    submitLabel = "Lämna in prov"
}) {

    const isFirst = index === 0;
    const isLast = index === total - 1;

    return (
        <div className="mt-6 min-w-0">

            <div className="relative flex flex-wrap items-center justify-between gap-2">

                <div className="min-w-0">
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

                <div className="absolute left-1/2 min-w-0 -translate-x-1/2">
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

                <div className="ml-auto min-w-0">
                    <Button
                        onClick={
                            isLast || timeExpired || softEnded || (allowSubmitAfterSeed && !isSeedPhase)
                                ? onSubmit
                                : onNext
                        }
                    >
                        {isLast || timeExpired || softEnded || (allowSubmitAfterSeed && !isSeedPhase) ? (
                            submitLabel
                        ) : (
                            <>
                                Nästa
                                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

        </div>
    );
}