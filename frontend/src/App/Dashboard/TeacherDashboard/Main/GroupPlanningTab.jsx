import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import PlanningBoard from "@/components/planning/PlanningBoard";
import EditLessonDialog from "@/components/ui/EditLessonDialog";
import CancelLessonDialog from "@/components/ui/CancelLessonDialog";
import DeleteLessonDialog from "@/components/ui/DeleteLessonDialog";

export default function GroupPlanningTab({
    groupId
}) {

    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editLesson, setEditLesson] = useState(null);
    const [lessonStatusDialog, setLessonStatusDialog] = useState(null);
    const [deleteLesson, setDeleteLesson] = useState(null);

        useEffect(() => {

        loadLessons();

        const reload = () => {
            loadLessons();
        };

        window.addEventListener(
            "lesson-section-added",
            reload
        );

        return () => {

            window.removeEventListener(
                "lesson-section-added",
                reload
            );

        };

    }, [groupId]);

    const loadLessons = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/lessons?groupIds=${groupId}`,
                    {
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setLessons(data);


        } finally {

            setLoading(false);

        }

    };

    return (
        <>
            <BaseTabLayout
                title="Planering"
            >

            <PlanningBoard
                groupId={groupId}
                lessons={lessons}
                loading={loading}
                onReload={loadLessons}
                onEditLesson={setEditLesson}
                onCancelLesson={setLessonStatusDialog}
                onDeleteLesson={setDeleteLesson}
            />

            </BaseTabLayout>

            <EditLessonDialog
                lesson={editLesson}
                open={!!editLesson}
                onOpenChange={() =>
                    setEditLesson(null)
                }
                onSaved={loadLessons}
            />

            <CancelLessonDialog
                lesson={lessonStatusDialog}
                open={!!lessonStatusDialog}
                onOpenChange={() =>
                    setLessonStatusDialog(null)
                }
                onSaved={loadLessons}
            />

            <DeleteLessonDialog
                lesson={deleteLesson}
                open={!!deleteLesson}
                onOpenChange={() =>
                    setDeleteLesson(null)
                }
                onDeleted={loadLessons}
            />
        </>

    );

}