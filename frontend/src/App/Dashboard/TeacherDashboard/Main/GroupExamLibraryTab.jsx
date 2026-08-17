import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import GroupExamLibrary from "@/components/ui/GroupExamLibrary";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CreateGroupExamDialog from "@/components/ui/CreateGroupExamDialog";
import { Button } from "@/components/ui/button";

export default function GroupExamLibraryTab({
    openTab
}) {

    const [groupExams,
        setGroupExams] = useState([]);

    const [
        createDialogOpen,
        setCreateDialogOpen
    ] = useState(false);

    useEffect(() => {

        loadGroupExams();

    }, []);

    const loadGroupExams = async () => {

        const response = await fetch(
            `${API_URL}/api/group-assessments`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        setGroupExams(data);

    };

    return (

        <>
            <BaseTabLayout

                title="Provtillfällen"

                actions={

                    <Button
                        onClick={() =>
                            setCreateDialogOpen(
                                true
                            )
                        }
                    >
                        Skapa provtillfälle
                    </Button>

                }

            >

                <GroupExamLibrary
                    groupExams={groupExams}
                    openTab={openTab}
                    onReload={loadGroupExams}
                />

            </BaseTabLayout>

            <CreateGroupExamDialog
                open={createDialogOpen}
                onOpenChange={
                    setCreateDialogOpen
                }
                onCreated={async () => {

                    await loadGroupExams();

                    setCreateDialogOpen(
                        false
                    );

                }}
            />
        </> 

    );

}