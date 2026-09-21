import { useEffect, useState } from "react";
import {
    ExternalLink,
    ListChecks,
    Loader2,
    RefreshCw
} from "lucide-react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FormatDateTimeShort from "@/utils/formatDateTimeShort";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { formatEventDuration } from "@/utils/normalizeExamEvents";
import { parseDatabaseDate } from "@/utils/parseDatabaseDate";

const formatCount = (count, singular, plural) =>
    `${count} ${count === 1 ? singular : plural}`;

function getBehaviorDetails(behavior) {
    return [
        `${formatCount(behavior.absence_count, "frånvarotillfälle", "frånvarotillfällen")}`,
        `längst ${formatEventDuration(behavior.longest_absence_seconds)}`,
        `totalt ${formatEventDuration(behavior.total_absence_seconds)}`
    ].filter(Boolean);
}

function getActivityDuration(item) {
    return Math.max(
        0,
        Math.round(
            (
                parseDatabaseDate(item.last_student_activity_at) -
                parseDatabaseDate(item.started_at)
            ) / 1000
        )
    );
}

export default function FollowUpTab({
    openTab,
    onCountChanged
}) {
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFollowUps = async () => {
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/students/follow-up-assessments`,
                {
                    headers: authHeaders()
                }
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            setFollowUps(data);
        } catch (error) {
            console.error(error);
            setFollowUps([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFollowUps();
    }, []);

    useEffect(() => {
        onCountChanged?.(followUps.length);
    }, [followUps.length, onCountChanged]);

    return (
        <BaseTabLayout
            title={`Följ upp (${followUps.length})`}
            actions={(
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadFollowUps}
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
                <div className="rounded-lg border bg-muted/30 p-4">
                    <h2 className="font-semibold">
                        Längre frånvaro från Math Camp
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Här visas bedömningar där eleven varit utanför provfönstret i minst 30 sekunder vid ett sammanhängande tillfälle.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                        <Loader2 className="size-5 animate-spin" />
                        Hämtar bedömningar...
                    </div>
                ) : followUps.length === 0 ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center text-green-800">
                        Inga bedömningar behöver följas upp.
                    </div>
                ) : (
                    followUps.map(item => (
                        <Card
                            key={item.attempt_id}
                            className="rounded-lg border-amber-300 bg-amber-50/30"
                        >
                            <CardHeader className="gap-2 border-b">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <CardTitle>
                                            {item.assessment_title || "Namnlös bedömning"}
                                        </CardTitle>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.student_name} • {item.group_name}
                                        </p>
                                    </div>

                                    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-900">
                                        <ListChecks className="size-3.5" />
                                        Längre frånvaro
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    {getBehaviorDetails(item.behavior).join(" • ")}
                                </p>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                        <span>Elevaktivitet:</span>
                                        <FormatDateTimeShort
                                            value={item.started_at}
                                        />
                                        <span>–</span>
                                        <FormatDateTimeShort
                                            value={item.last_student_activity_at}
                                        />
                                        <span>
                                            ({formatEventDuration(getActivityDuration(item))})
                                        </span>
                                    </span>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5"
                                        onClick={() =>
                                            openTab({
                                                id: `student-${item.student_id}-attempt-${item.attempt_id}`,
                                                type: "student",
                                                title: item.student_name,
                                                studentId: item.student_id,
                                                groupId: item.group_id,
                                                attemptId: item.attempt_id
                                            })
                                        }
                                    >
                                        <ExternalLink size={14} />
                                        Öppna resultat
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </BaseTabLayout>
    );
}