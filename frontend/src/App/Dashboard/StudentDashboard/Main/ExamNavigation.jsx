import { Button } from "@/components/ui/button";

export default function ExamNavigation({
    index,
    total,
    allowPrevious,
    showReset,
    onPrev,
    onNext,
    onReset
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
                <Button onClick={onNext}>
                    {isLast
                        ? "Avsluta prov"
                        : "Nästa →"}
                </Button>
            </div>

        </div>
    );
}