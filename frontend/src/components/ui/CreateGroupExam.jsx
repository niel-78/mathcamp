import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CreateGroupExam({
    onCreated
}) {

    const [groups, setGroups] =
        useState([]);

    const [exams, setExams] =
        useState([]);

    const [groupId, setGroupId] =
        useState("");

    const [examId, setExamId] =
        useState("");

    useEffect(() => {

        loadData();

    }, []);

    const loadData = async () => {

        const [
            groupsResponse,
            examsResponse
        ] = await Promise.all([
            fetch(
                `${API_URL}/api/groups`,
                {
                    headers: authHeaders()
                }
            ),
            fetch(
                `${API_URL}/api/exams`,
                {
                    headers: authHeaders()
                }
            )
        ]);

        if (groupsResponse.ok) {

            setGroups(
                await groupsResponse.json()
            );

        }

        if (examsResponse.ok) {

            setExams(
                await examsResponse.json()
            );

        }

    };

    const createGroupExam = async () => {

        if (!groupId || !examId) {
            return;
        }

        const response = await fetch(
            `${API_URL}/api/group-exams`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    group_id: Number(groupId),
                    exam_id: Number(examId)
                })
            }
        );

        if (!response.ok) {

            const error =
                await response.json();

            toast.error(error.error);

            return;

        }

        setGroupId("");
        setExamId("");

        await onCreated?.();

    };

    return (

        <div className="mb-6 border rounded p-4">

            <h2 className="font-semibold mb-4">
                Skapa provtillfälle
            </h2>

            <div className="grid gap-3">

                <select
                    className="border rounded p-2"
                    value={groupId}
                    onChange={(e) =>
                        setGroupId(
                            e.target.value
                        )
                    }
                >
                    <option value="">
                        Välj grupp
                    </option>

                    {groups.map(group => (

                        <option
                            key={group.id}
                            value={group.id}
                        >
                            {group.name}
                        </option>

                    ))}

                </select>

                <select
                    className="border rounded p-2"
                    value={examId}
                    onChange={(e) =>
                        setExamId(
                            e.target.value
                        )
                    }
                >
                    <option value="">
                        Välj prov
                    </option>

                    {exams.map(exam => (

                        <option
                            key={exam.id}
                            value={exam.id}
                        >
                            {exam.title}
                        </option>

                    ))}

                </select>

                <Button
                    onClick={createGroupExam}
                >
                    Skapa provtillfälle
                </Button>

            </div>

        </div>

    );

}