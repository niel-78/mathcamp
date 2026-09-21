import { useEffect, useState } from "react";
import {
    Check,
    ClipboardX,
    ExternalLink,
    Loader2,
    RefreshCw
} from "lucide-react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

const statusLabels = {
    not_started: "Inte påbörjat",
    in_progress: "Pågår",
    locked: "Låst"
};

export default function UnsubmittedTab({
    openTab,
    onCountChanged
}) {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submittingAttemptId, setSubmittingAttemptId] = useState(null);

    const loadAttempts = async () => {
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/students/unsubmitted-assessments`,
                {
                    headers: authHeaders()
                }
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            setAttempts(data);
        } catch (error) {
            console.error(error);
            setAttempts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttempts();
    }, []);

    useEffect(() => {
        onCountChanged?.(attempts.length);
    }, [attempts.length, onCountChanged]);

    const submitAttempt = async (attemptId) => {
        setSubmittingAttemptId(attemptId);

        try {
            const response = await fetch(
                `${API_URL}/api/students/unsubmitted-assessments/${attemptId}/submit`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Kunde inte lämna in provet.");
            }

            setAttempts(current =>
                current.filter(attempt => attempt.attempt_id !== attemptId)
            );
        } catch (error) {
            console.error(error);
        } finally {
            setSubmittingAttemptId(null);
        }
    };

    return (
        <BaseTabLayout
            title={`Ej inlämnade (${attempts.length})`}
            actions={(
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAttempts}
                    disabled={loading}
                    className="gap-1.5"
                >
                    <RefreshCw
                        size={14}
                        className={loading ? "animate-spin" : ""}
                    />
                    Uppdatera
                </Button>
            )}
        >
            <div className="max-w-5xl space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                        <Loader2 className="size-5 animate-spin" />
                        Hämtar ej inlämnade prov...
                    </div>
                ) : attempts.length === 0 ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center text-green-800">
                        Alla prov är inlämnade.
                    </div>
                ) : (
                    attempts.map(attempt => {
                        const studentName = [
                            attempt.first_name,
                            attempt.last_name
                        ].filter(Boolean).join(" ");

                        return (
                            <Card key={attempt.attempt_id}>
                                <CardHeader className="gap-2 border-b">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <CardTitle>
                                                {attempt.assessment_title || "Namnlöst prov"}
                                            </CardTitle>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {studentName || "Okänd elev"} • {attempt.group_name}
                                            </p>
                                        </div>

                                        <Badge variant="outline">
                                            <ClipboardX className="size-3.5" />
                                            {statusLabels[attempt.status] || attempt.status}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-xs text-muted-foreground">
                                        {attempt.started_at
                                            ? `Påbörjat ${new Date(attempt.started_at).toLocaleString("sv-SE")}`
                                            : "Inte påbörjat"}
                                    </span>

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5"
                                            onClick={() =>
                                                openTab({
                                                    id: `student-${attempt.student_id}-attempt-${attempt.attempt_id}`,
                                                    type: "student",
                                                    title: studentName || "Elev",
                                                    studentId: attempt.student_id,
                                                    groupId: attempt.group_id,
                                                    attemptId: attempt.attempt_id
                                                })
                                            }
                                        >
                                            <ExternalLink size={14} />
                                            Öppna elev
                                        </Button>

                                        <Button
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => submitAttempt(attempt.attempt_id)}
                                            disabled={submittingAttemptId !== null}
                                        >
                                            <Check size={14} />
                                            {submittingAttemptId === attempt.attempt_id
                                                ? "Lämnar in..."
                                                : "Lämna in"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </BaseTabLayout>
    );
}