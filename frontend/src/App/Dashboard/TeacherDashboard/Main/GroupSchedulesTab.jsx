import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import { Button } from "@/components/ui/button";
import EditGroupScheduleDialog from "./EditGroupScheduleDialog";

export default function GroupSchedulesTab({
    groupId
}) {

    const [schedules, setSchedules] =
        useState([]);

    const [scheduleToEdit,
        setScheduleToEdit] =
        useState(null);

    useEffect(() => {

        loadSchedules();

    }, [groupId]);

    const loadSchedules = async () => {

        const response =
            await fetch(
                `${API_URL}/api/group-schedules?groupId=${groupId}`,
                {
                    headers:
                        authHeaders()
                }
            );

        const data =
            await response.json();
        console.log("SCHEDULE DATA", data);
        setSchedules(data);

        

    };


    if (schedules.length === 0) {
        return (
            <BaseTabLayout title="Scheman">

                <CardSection title="Schema">

                    <div className="text-muted-foreground">
                        Gruppen har inga lektioner ännu.
                        Skapa lektioner först.
                    </div>

                </CardSection>

            </BaseTabLayout>
        );
    }

    return (

        <>
            <BaseTabLayout
                title="Scheman"
            >

                <div className="space-y-4">

                    {schedules.map(
                        schedule => (

                            <CardSection
                                key={schedule.id}
                                title={
                                    [
                                        "Söndag",
                                        "Måndag",
                                        "Tisdag",
                                        "Onsdag",
                                        "Torsdag",
                                        "Fredag",
                                        "Lördag"
                                    ][schedule.weekday]
                                }
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                    "
                                >

                                    <div>

                                        <div>
                                            {schedule.start_time}
                                            {" - "}
                                            {schedule.end_time}
                                        </div>

                                        <div
                                            className="
                                                text-sm
                                                text-muted-foreground
                                            "
                                        >
                                            {schedule.valid_from}
                                            {" → "}
                                            {schedule.valid_to}
                                        </div>

                                    </div>

                                    <Button
                                        onClick={() =>
                                            setScheduleToEdit(
                                                schedule
                                            )
                                        }
                                    >
                                        Redigera
                                    </Button>

                                </div>

                            </CardSection>

                        )
                    )}

                </div>

            </BaseTabLayout>

            <EditGroupScheduleDialog
                schedule={
                    scheduleToEdit
                }
                open={
                    !!scheduleToEdit
                }
                onOpenChange={() =>
                    setScheduleToEdit(null)
                }
                onSaved={
                    loadSchedules
                }
            />

        </>

    );

}