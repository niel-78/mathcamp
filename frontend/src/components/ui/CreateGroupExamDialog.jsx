import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { toast } from "sonner";

export default function CreateGroupExamDialog({
    open,
    onOpenChange,
    onCreated
}) {

    const [groups, setGroups] =
        useState([]);

    const [assessments, setExams] =
        useState([]);

    const [groupId, setGroupId] =
        useState("");

    const [assessmentId, setExamId] =
        useState("");

    useEffect(() => {

        if (open) {
            loadData();
        }

    }, [open]);

    const loadData = async () => {

        const [
            groupsResponse,
            assessmentsResponse
        ] = await Promise.all([
            fetch(
                `${API_URL}/api/groups`,
                {
                    headers: authHeaders()
                }
            ),
            fetch(
                `${API_URL}/api/assessments`,
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

        if (assessmentsResponse.ok) {

            setExams(
                await assessmentsResponse.json()
            );

        }

    };

    const createGroupExam = async () => {

        if (!groupId || !assessmentId) {

            toast.error(
                "Du måste välja grupp och prov"
            );

            return;

        }

        const response = await fetch(
            `${API_URL}/api/group-assessments`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    group_id: Number(groupId),
                    assessment_id: Number(assessmentId)
                })
            }
        );

        if (!response.ok) {

            const error =
                await response.json();

            toast.error(
                error.error
            );

            return;

        }

        toast.success(
            "Provtillfälle skapat"
        );

        setGroupId("");
        setExamId("");

        await onCreated?.();

        onOpenChange(false);

    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Skapa provtillfälle
                    </DialogTitle>

                </DialogHeader>

                <div
                    className="
                        space-y-4
                    "
                >

                    <div>

                        <label
                            className="
                                text-sm
                                font-medium
                                block
                                mb-1
                            "
                        >
                            Grupp
                        </label>

                        <select
                            className="
                                input-standard
                                w-full
                            "
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

                    </div>

                    <div>

                        <label
                            className="
                                text-sm
                                font-medium
                                block
                                mb-1
                            "
                        >
                            Prov
                        </label>

                        <select
                            className="
                                input-standard
                                w-full
                            "
                            value={assessmentId}
                            onChange={(e) =>
                                setExamId(
                                    e.target.value
                                )
                            }
                        >

                            <option value="">
                                Välj prov
                            </option>

                            {assessments.map(assessment => (

                                <option
                                    key={assessment.id}
                                    value={assessment.id}
                                >
                                    {assessment.title}
                                </option>

                            ))}

                        </select>

                    </div>

                    <div
                        className="
                            flex
                            justify-end
                            gap-2
                        "
                    >

                        <Button
                            variant="outline"
                            onClick={() =>
                                onOpenChange(
                                    false
                                )
                            }
                        >
                            Avbryt
                        </Button>

                        <Button
                            onClick={
                                createGroupExam
                            }
                        >
                            Skapa
                        </Button>

                    </div>

                </div>

            </DialogContent>

        </Dialog>

    );

}