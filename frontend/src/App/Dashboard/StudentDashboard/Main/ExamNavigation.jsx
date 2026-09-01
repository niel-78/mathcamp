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
    onSubmit
}) {

    const isFirst = index === 0;
    const isLast = index === total - 1;

    if (timeExpired) {
        return null;
    }

    return (
        <div className="flex items-center justify-between mt-6">

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
                        isLast
                            ? onSubmit
                            : onNext
                    }
                >
                    {isLast
                        ? "Lämna in prov"
                        : "Nästa →"}
                </Button>
            </div>
        </div>
    );
}