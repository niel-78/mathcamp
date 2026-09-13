import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";

export default function AutoFixConfirmDialog({
    open,
    onOpenChange,
    count,
    inProgress = false,
    progress = { current: 0, total: 0, percent: 0, message: "" },
    onConfirm
}) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (inProgress) return;
                onOpenChange(nextOpen);
            }}
        >
            <AlertDialogContent className="sm:max-w-lg">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            {inProgress ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Sparkles size={20} />
                            )}
                        </div>
                        <AlertDialogTitle className="text-lg">
                            {inProgress ? "Åtgärdar uppgifter..." : "Åtgärda alla fel automatiskt?"}
                        </AlertDialogTitle>
                    </div>

                    <AlertDialogDescription
                        render={<div className="text-left text-sm text-muted-foreground space-y-4 pt-2" />}
                    >
                        {!inProgress ? (
                            <>
                                <div>
                                    Vill du automatiskt analysera och åtgärda felen i{" "}
                                    <strong className="text-foreground">{count} {count === 1 ? "uppgift" : "uppgifter"}</strong>?
                                </div>

                                <div className="rounded-xl border bg-muted/40 p-3.5 text-xs text-foreground/90 space-y-2">
                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                        <CheckCircle2 size={14} className="text-green-600" />
                                        <span>Detta kommer att utföras:</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
                                        <li>
                                            <strong className="text-foreground">Beräkna & markera facit:</strong> Löser matematiska uttryck och ekvationer samt sätter rätt svar.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">Åtgärda dubblettsvar:</strong> Ersätter förväxlingsbara alternativ med unika, rimliga distraktorer.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">Synkronisera svarsrutor:</strong> Anpassar antalet <code>{'{{input}}'}</code> efter antalet rötter/facit.
                                        </li>
                                        <li>
                                            <strong className="text-foreground">Rensa felanmälningar:</strong> Tar bort elev-rapporter för åtgärdade uppgifter.
                                        </li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3 py-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-foreground">
                                        {progress.message || "Bearbetar uppgifter..."}
                                    </span>
                                    <span className="font-bold text-primary">
                                        {progress.percent}%
                                    </span>
                                </div>

                                <div className="h-3 w-full overflow-hidden rounded-full bg-muted border">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                                        style={{ width: `${progress.percent}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        Uppgift {progress.current} av {progress.total || count}
                                    </span>
                                    <span>
                                        {progress.percent === 100 ? "Slutför..." : "Vänligen vänta..."}
                                    </span>
                                </div>
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="pt-2">
                    {!inProgress ? (
                        <>
                            <AlertDialogCancel>
                                Avbryt
                            </AlertDialogCancel>

                            <AlertDialogAction
                                onClick={onConfirm}
                                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                <Sparkles size={14} />
                                Åtgärda {count} {count === 1 ? "uppgift" : "uppgifter"}
                            </AlertDialogAction>
                        </>
                    ) : (
                        <div className="w-full flex items-center justify-center text-xs text-muted-foreground py-1">
                            Processen pågår, stäng inte fönstret...
                        </div>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
