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
        <div className="mt-6 min-w-0">

            {canSubmitAnytime && (
            <div className="mb-4 flex flex-wrap justify-end gap-2">
                    <Button
                        onClick={onSubmit}
                        variant="outline"
                    >
                        {submitLabel}
                    </Button>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">

                <div className="min-w-0">
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

                <div className="min-w-0">
                    {showReset && (
                        <Button
                            onClick={onReset}
                            variant="secondary"
                        >
                            ↺ Återställ
                        </Button>
                    )}
                </div>

                <div className="ml-auto min-w-0">
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