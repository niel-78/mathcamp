import { useEffect, useState } from "react";

import BaseTabLayout from "@/components/layouts/BaseTabLayout";

import PlanningBoard from "@/components/planning/PlanningBoard";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";



export default function TeacherCalendarTab() {

    const [lessons, setLessons] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const load = async () => {

        const response =
            await fetch(
                `${API_URL}/api/lessons/teacher`,
                {
                    headers:
                        authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        setLessons(data);

        setLoading(false);

    };

    useEffect(() => {

        load();

    }, []);

    return (

        <BaseTabLayout
            title="Min kalender"
        >

            <PlanningBoard
                lessons={lessons}
                loading={loading}
                showGroupName={true}
                readOnly
            />

        </BaseTabLayout>

    );

}