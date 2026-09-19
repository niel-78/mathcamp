import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import MathContent from "@/components/ui/MathContent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuestionIssues } from "@/utils/getQuestionIssues";
import { autoFixQuestionApi, autoFixAllQuestionsApi } from "@/api/questionApi";
import { toast } from "sonner";
import AutoFixConfirmDialog from "@/components/ui/AutoFixConfirmDialog";
import ArchiveQuestionDialog from "@/components/ui/ArchiveQuestionDialog";
import { AlertCircle, ExternalLink, Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";

export default function ActionRequiredTab({
    openTab,
    onBlockChanged
}) {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fixingQuestionId, setFixingQuestionId] = useState(null);
    const [fixingAll, setFixingAll] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [questionToArchive, setQuestionToArchive] = useState(null);
    const [fixProgress, setFixProgress] = useState({
        current: 0,
        total: 0,
        percent: 0,
        message: ""
    });

    const loadBlocks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/blocks/`, {
                headers: authHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setBlocks(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBlocks();
    }, []);

    // Samla ihop alla frågor som har problem från aktiva (ej raderade/arkiverade) block
    const questionsWithIssues = [];

    const activeBlocks = (blocks || []).filter(
        block => !block.deleted_at && !block.archived_at
    );

    activeBlocks.forEach(block => {
        (block.questions || []).forEach((q, idx) => {
            if (!q.deleted_at && !q.archived_at) {
                const issues = getQuestionIssues(q, block);
                if (issues.length > 0) {
                    questionsWithIssues.push({
                        question: q,
                        block,
                        questionIndex: idx + 1,
                        issues
                    });
                }
            }
        });
    });

    const handleFixSingleQuestion = async (questionId) => {
        setFixingQuestionId(questionId);
        try {
            const result = await autoFixQuestionApi(questionId);
            if (result.success && result.fixed) {
                toast.success(`Uppgift #${questionId} åtgärdades: ${result.changes.join(" ")}`);
            } else if (result.success) {
                toast.info(`Uppgift #${questionId}: ${result.message || "Inga ändringar behövdes."}`);
            } else {
                toast.error(`Kunde inte åtgärda uppgift #${questionId}: ${result.message}`);
            }
            await loadBlocks();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Kunde inte åtgärda frågan.");
        } finally {
            setFixingQuestionId(null);
        }
    };

    const executeFixAllQuestions = async () => {
        if (questionsWithIssues.length === 0) return;

        const total = questionsWithIssues.length;
        setFixingAll(true);
        setFixProgress({
            current: 0,
            total,
            percent: 0,
            message: "Startar åtgärdsprocess..."
        });

        let totalFixed = 0;
        const BATCH_SIZE = 5;

        try {
            const questionIds = questionsWithIssues.map(item => item.question.id);

            for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
                const batch = questionIds.slice(i, i + BATCH_SIZE);
                const result = await autoFixAllQuestionsApi(batch);
                totalFixed += result.totalFixed || 0;

                const processed = Math.min(i + BATCH_SIZE, total);
                const percent = Math.round((processed / total) * 100);

                setFixProgress({
                    current: processed,
                    total,
                    percent,
                    message: `Åtgärdar uppgift ${processed} av ${total}...`
                });
            }

            toast.success(`Klart! Åtgärdade ${totalFixed} av ${total} uppgifter.`);
            await loadBlocks();
            await onBlockChanged?.();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Ett fel uppstod vid åtgärdande av frågor.");
        } finally {
            setFixingAll(false);
            setConfirmDialogOpen(false);
        }
    };

    return (
        <BaseTabLayout
            title={`Kräver åtgärd (${questionsWithIssues.length})`}
            actions={
                questionsWithIssues.length > 0 && (
                    <Button
                        variant="default"
                        size="sm"
                        disabled={fixingAll || loading}
                        onClick={() => setConfirmDialogOpen(true)}
                        className="hidden gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm sm:inline-flex"
                    >
                        {fixingAll ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Sparkles size={16} />
                        )}
                        <span>Åtgärda alla fel ({questionsWithIssues.length})</span>
                    </Button>
                )
            }
        >
            <div className="space-y-6 max-w-5xl min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-4 rounded-2xl border">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <AlertCircle className="text-destructive size-5" />
                            Uppgifter som kräver åtgärd
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Frågor med saknade facit, felaktiga alternativ, fel antal svarsrutor eller inkomna felanmälningar.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {questionsWithIssues.length > 0 && (
                            <Button
                                variant="default"
                                size="sm"
                                disabled={fixingAll || loading}
                                onClick={() => setConfirmDialogOpen(true)}
                                className="gap-2"
                            >
                                {fixingAll ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Sparkles size={14} />
                                )}
                                <span>Åtgärda alla</span>
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadBlocks}
                            disabled={loading || fixingAll}
                            className="gap-1.5"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            Uppdatera
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-sm text-muted-foreground py-12 text-center flex flex-col items-center justify-center gap-2">
                        <Loader2 size={24} className="animate-spin text-primary" />
                        <span>Analyserar frågor...</span>
                    </div>
                ) : questionsWithIssues.length === 0 ? (
                    <div className="border border-green-200 bg-green-50 text-green-800 rounded-2xl p-8 text-center space-y-2">
                        <p className="font-semibold text-lg">Inga fel hittades!</p>
                        <p className="text-sm text-green-700">
                            Alla frågor i dina aktiva block har korrekta svarsalternativ, entydiga värden och rätt antal svarsrutor.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {questionsWithIssues.map(({ question, block, questionIndex, issues }) => {
                            const isFixingThis = fixingQuestionId === question.id;

                            return (
                                <Card key={question.id} className="border-amber-300/80 bg-amber-50/10 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 gap-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <CardTitle className="text-base">
                                                Uppgift #{question.id}
                                            </CardTitle>
                                            <Badge variant="outline">
                                                Block #{block.id} {block.title ? `(${block.title})` : ""} — Fråga {questionIndex}
                                            </Badge>
                                            <Badge variant="destructive" className="gap-1">
                                                <AlertCircle size={12} />
                                                {issues.length} {issues.length === 1 ? "problem" : "problem"}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                disabled={isFixingThis || fixingAll}
                                                onClick={() => handleFixSingleQuestion(question.id)}
                                                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                                            >
                                                {isFixingThis ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Wand2 size={14} />
                                                )}
                                                <span>Åtgärda fel</span>
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setQuestionToArchive(question)}
                                            >
                                                Arkivera
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openTab({
                                                        id: `block-${block.id}`,
                                                        title: `Block #${block.id}`,
                                                        type: "block",
                                                        block
                                                    })
                                                }
                                            >
                                                Öppna block
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openTab({
                                                        id: `question-${question.id}`,
                                                        title: `Uppgift #${question.id}`,
                                                        type: "question",
                                                        questionId: question.id
                                                    })
                                                }
                                                className="gap-1"
                                            >
                                                <ExternalLink size={14} />
                                                Öppna fråga
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3 pt-1">
                                        <div className="bg-background border rounded-xl p-3">
                                            <MathContent value={question.question} />
                                        </div>

                                        {question.options?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {question.options.map(opt => (
                                                    <div
                                                        key={opt.id}
                                                        className={`border rounded-lg px-2.5 py-1 flex items-center gap-1.5 ${
                                                            opt.is_correct
                                                                ? "bg-green-500/10 border-green-500/30 text-green-800 font-semibold"
                                                                : "bg-background text-muted-foreground"
                                                        }`}
                                                    >
                                                        <MathContent value={opt.text} />
                                                        <span className="text-[10px] opacity-75">
                                                            {opt.is_correct ? "✓ Korrekt" : "✗"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-1">
                                            <div className="font-semibold flex items-center gap-1.5">
                                                <AlertCircle size={14} className="shrink-0" />
                                                <span>Identifierade problem:</span>
                                            </div>
                                            <ul className="list-disc list-inside space-y-0.5 opacity-90 pl-1">
                                                {issues.map((issue, i) => (
                                                    <li key={i}>{issue.message}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <ArchiveQuestionDialog
                question={questionToArchive}
                open={!!questionToArchive}
                onOpenChange={(open) => {
                    if (!open) {
                        setQuestionToArchive(null);
                    }
                }}
                onArchived={async () => {
                    setQuestionToArchive(null);
                    await loadBlocks();
                }}
            />

            <AutoFixConfirmDialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                count={questionsWithIssues.length}
                inProgress={fixingAll}
                progress={fixProgress}
                onConfirm={executeFixAllQuestions}
            />
        </BaseTabLayout>
    );
}
