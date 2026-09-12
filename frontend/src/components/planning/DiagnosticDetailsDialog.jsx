import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, AlertCircle, CheckCircle2, ClipboardCheck, Loader2 } from "lucide-react";

export default function DiagnosticDetailsDialog({
    open,
    onOpenChange,
    assessment,
    lessonId,
    isPublic = false,
    hideCompletions = false
}) {
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open || !assessment || !lessonId) {
            setDetails(null);
            setError(null);
            return;
        }

        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const endpoint = isPublic
                    ? `${API_URL}/api/public/lessons/${lessonId}/group-assessments/${assessment.id}/diagnostic-details`
                    : `${API_URL}/api/lessons/${lessonId}/group-assessments/${assessment.id}/diagnostic-details`;

                const res = await fetch(
                    endpoint,
                    {
                        headers: isPublic ? {} : authHeaders()
                    }
                );

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Kunde inte hämta information om diagnosen.");
                }

                const data = await res.json();
                setDetails(data);
            } catch (err) {
                console.error("fetchDetails error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [open, assessment, lessonId, isPublic]);

    const includedSections = details?.sections || [];
    const shouldHideCompletions = hideCompletions || isPublic || details?.hideCompletions;
    const complementSections = details?.complement_sections || [];
    const hasComplement = complementSections.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <ClipboardCheck className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Provtillfälle</span>
                    </div>
                    <DialogTitle className="text-xl font-bold">
                        Diagnos
                    </DialogTitle>
                    <DialogDescription>
                        {shouldHideCompletions
                            ? "Översikt över ingående sidor för detta prov."
                            : "Översikt över ingående sidor och eventuell komplettering för detta prov."}
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-sm">Hämtar information...</span>
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {!loading && !error && details && (
                    <div className="space-y-5 py-2">
                        {/* SEKTION 1: Sidor som ingår i diagnosen */}
                        <div className="rounded-xl border bg-slate-50/50 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    <span>Sidor som ingår i diagnosen</span>
                                </div>
                                {includedSections.length > 0 && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                        Sid {includedSections.map(s => s.page_range).join(", ")}
                                    </span>
                                )}
                            </div>

                            {includedSections.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    Inga specifika sidor angivna för denna diagnos.
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {includedSections.map(sec => (
                                        <div
                                            key={sec.id}
                                            className="flex items-center justify-between gap-2 text-xs bg-white border rounded-lg px-3 py-2 shadow-xs"
                                        >
                                            <span className="font-medium text-slate-800">{sec.title}</span>
                                            <span className="text-muted-foreground font-mono">
                                                sid {sec.page_range}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SEKTION 2: Komplettering (visas ej i delad länk) */}
                        {!shouldHideCompletions && (
                            <div className="rounded-xl border p-4 space-y-3">
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                    {hasComplement ? (
                                        <>
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <span className="text-amber-900">Sektioner att komplettera</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            <span className="text-emerald-900">Komplettering</span>
                                        </>
                                    )}
                                </div>

                                {hasComplement ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-amber-800">
                                            Du har tidigare förmågor som du behöver komplettera i denna diagnos:
                                        </p>
                                        <div className="space-y-1.5">
                                            {complementSections.map(sec => (
                                                <div
                                                    key={sec.id}
                                                    className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs space-y-1"
                                                >
                                                    <div className="flex items-center justify-between font-semibold text-amber-950">
                                                        <span>{sec.title}</span>
                                                        <span className="font-mono text-amber-800">
                                                            sid {sec.page_range}
                                                        </span>
                                                    </div>
                                                    {sec.abilities && sec.abilities.length > 0 && (
                                                        <div className="text-[11px] text-amber-700">
                                                            Förmågor: {sec.abilities.map(a => a.name).join(", ")}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800">
                                        <span>Du har inga tidigare sektioner som behöver kompletteras.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Stäng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
