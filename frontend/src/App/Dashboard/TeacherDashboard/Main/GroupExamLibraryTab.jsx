import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import GroupExamLibrary
    from "@/components/ui/GroupExamLibrary";

export default function GroupExamLibraryTab({
    openTab
}) {

    const [groupExams,
        setGroupExams] = useState([]);

    useEffect(() => {

        loadGroupExams();

    }, []);

    const loadGroupExams = async () => {

        const response = await fetch(
            `${API_URL}/api/group-exams`,
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

        <GroupExamLibrary
            groupExams={groupExams}
            openTab={openTab}
            onReload={loadGroupExams}
        />

    );

}