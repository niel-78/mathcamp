import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import PlanningBoard from "@/features/planning/PlanningBoard";

export default function MyLessonsTab() {

    const [lessons, setLessons] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const loadLessons = async () => {

        setLoading(true);

        const response =
            await fetch(
                `${API_URL}/api/lessons/my`,
                {
                    headers:
                        authHeaders()
                }
            );

        if (!response.ok) {

            setLoading(false);
            return;

        }

        setLessons(
            await response.json()
        );

        setLoading(false);

    };

    return (

        <PlanningBoard
            groupId={null}
            lessons={lessons}
            loading={loading}
            onReload={loadLessons}
        />

    );

}