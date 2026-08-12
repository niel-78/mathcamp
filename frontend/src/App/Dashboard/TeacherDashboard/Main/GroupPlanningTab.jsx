import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import PlanningBoard from "@/components/planning/PlanningBoard";

export default function GroupPlanningTab({
    groupId
}) {

    const [lessons, setLessons] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        loadLessons();

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

            console.log(data);

        } finally {

            setLoading(false);

        }

    };

    return (

        <BaseTabLayout
            title="Planering"
        >

            <PlanningBoard
                lessons={lessons}
                loading={loading}
                onReload={loadLessons}
            />

        </BaseTabLayout>

    );

}