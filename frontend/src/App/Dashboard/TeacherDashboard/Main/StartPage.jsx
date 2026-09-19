import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";   
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { getQuestionIssues } from "@/utils/getQuestionIssues";
import { AlertCircle, ClipboardX, ListChecks } from "lucide-react";

export default function StartPage({
    openTab
}) {
    const [issueCount, setIssueCount] = useState(0);
    const [followUpCount, setFollowUpCount] = useState(0);
    const [unsubmittedCount, setUnsubmittedCount] = useState(0);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const res = await fetch(`${API_URL}/api/blocks/`, {
                    headers: authHeaders()
                });
                if (res.ok) {
                    const blocks = await res.json();
                    let count = 0;
                    const activeBlocks = (blocks || []).filter(
                        b => !b.deleted_at && !b.archived_at
                    );
                    activeBlocks.forEach(b => {
                        (b.questions || []).forEach(q => {
                            if (!q.deleted_at && !q.archived_at) {
                                const issues = getQuestionIssues(q, b);
                                if (issues.length > 0) {
                                    count += 1;
                                }
                            }
                        });
                    });
                    setIssueCount(count);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchIssues();
    }, []);

    useEffect(() => {
        const fetchUnsubmitted = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/students/unsubmitted-assessments`,
                    {
                        headers: authHeaders()
                    }
                );

                if (response.ok) {
                    const attempts = await response.json();
                    setUnsubmittedCount(attempts.length);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchUnsubmitted();
    }, []);

    useEffect(() => {
        const fetchFollowUps = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/students/follow-up-assessments`,
                    {
                        headers: authHeaders()
                    }
                );

                if (response.ok) {
                    const followUps = await response.json();
                    setFollowUpCount(followUps.length);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchFollowUps();
    }, []);

    return (
        <BaseTabLayout
            title="Startsida"
        >
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    onClick={() =>
                        openTab({
                            id: "teacher-calendar",
                            title: "Min kalender",
                            type: "teacher-calendar"
                        })
                    }
                >
                    Min kalender
                </Button>

                <Button
                    onClick={() =>
                        openTab({
                            id: "assessments",
                            title: "Provbank",
                            type: "assessments"
                        })
                    }
                >
                    Provbank
                </Button>

                <Button
                    onClick={() =>
                        openTab({
                            id: "blocks",
                            title: "Frågebank",
                            type: "blocks"
                        })
                    }
                >
                    Frågebank
                </Button>

                <Button
                    variant={issueCount > 0 ? "destructive" : "outline"}
                    className="gap-2"
                    onClick={() =>
                        openTab({
                            id: "action-required",
                            title: `Kräver åtgärd (${issueCount})`,
                            type: "action-required"
                        })
                    }
                >
                    <AlertCircle size={16} />
                    <span>Kräver åtgärd</span>
                    {issueCount > 0 && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-xs font-bold bg-white text-destructive">
                            {issueCount}
                        </Badge>
                    )}
                </Button>

                <Button
                    variant="outline"
                    className={followUpCount > 0
                        ? "gap-2 border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100"
                        : "gap-2"
                    }
                    onClick={() =>
                        openTab({
                            id: "follow-up",
                            title: `Följ upp (${followUpCount})`,
                            type: "follow-up"
                        })
                    }
                >
                    <ListChecks size={16} />
                    <span>Följ upp</span>
                    {followUpCount > 0 && (
                        <Badge className="bg-amber-700 px-1.5 py-0 text-xs font-bold text-white">
                            {followUpCount}
                        </Badge>
                    )}
                </Button>

                <Button
                    variant={unsubmittedCount > 0 ? "destructive" : "outline"}
                    className="gap-2"
                    onClick={() =>
                        openTab({
                            id: "unsubmitted",
                            title: `Ej inlämnade (${unsubmittedCount})`,
                            type: "unsubmitted"
                        })
                    }
                >
                    <ClipboardX size={16} />
                    <span>Ej inlämnade</span>
                    {unsubmittedCount > 0 && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-xs font-bold bg-white text-destructive">
                            {unsubmittedCount}
                        </Badge>
                    )}
                </Button>

                <Button
                    onClick={() =>
                        openTab({
                            id: "group-assessments",
                            title: "Provtillfällen",
                            type: "group-assessments"
                        })
                    }
                >
                    Provtillfällen
                </Button>

                <Button
                    onClick={() =>
                        openTab({
                            id: "presentations",
                            title: "Presentationer",
                            type: "presentations"
                        })
                    }
                >
                    Presentationer
                </Button>
            </div>
        </BaseTabLayout>
    );
}