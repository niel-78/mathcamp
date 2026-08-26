import { useEffect, useState} from "react";

import PlanningBoard from "@/components/planning/PlanningBoard";

import { API_URL } from "@/config";

export default function SharedPlanningPage() {

    const shareId =
        window.location.pathname
            .split("/")
            .pop();

    const [loading, setLoading] =
        useState(true);

    const [lessons, setLessons] =
        useState([]);

    const [events, setEvents] =
        useState([]);

    useEffect(() => {

        const load =
            async () => {

                const response =
                    await fetch(
                        `${API_URL}/api/public/planning/${shareId}`
                    );

                if (!response.ok) {

                    setLoading(false);
                    return;

                }

                const data =
                    await response.json();

                setLessons(
                    data.lessons ?? []
                );

                setEvents(
                    data.events ?? []
                );

                setLoading(false);

            };

        load();

    }, [shareId]);

    return (

        <PlanningBoard
            lessons={lessons}
            events={events}
            loading={loading}
            readOnly
        />

    );

}