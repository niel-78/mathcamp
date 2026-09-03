import { Button } from "@/components/ui/button";

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
    canSubmitAnytime,
    submitLabel = "Lämna in prov"
}) {

    const isFirst = index === 0;
    const isLast = index === total - 1;

    return (
        <div className="mt-6">

            {canSubmitAnytime && (
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={onSubmit}
                        variant="outline"
                    >
                        {submitLabel}
                    </Button>
                </div>
            )}

            <div className="flex items-center justify-between">

                <div>
                    {allowPrevious && (
                        <Button
                            onClick={onPrev}
                            disabled={isFirst}
                            variant="outline"
                        >
                            ← Föregående
                        </Button>
                    )}
                </div>

                <div>
                    {showReset && (
                        <Button
                            onClick={onReset}
                            variant="secondary"
                        >
                            ↺ Återställ
                        </Button>
                    )}
                </div>

                <div>
                    <Button
                        onClick={
                            isLast || timeExpired
                                ? onSubmit
                                : onNext
                        }
                    >
                        {isLast || timeExpired
                            ? submitLabel
                            : "Nästa →"}
                    </Button>
                </div>
            </div>

        </div>
    );
}