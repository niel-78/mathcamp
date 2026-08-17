import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";

import ExamCard from "@/components/ui/ExamCard";
import CreateExam from "@/components/ui/CreateExam";

import NewExamDialog from "@/components/ui/NewExamDialog";
import ArchiveExamDialog from "@/components/ui/ArchiveExamDialog";

import BaseTabLayout from "@/components/layouts/BaseTabLayout";

export default function ExamListTab({
    selectedExamId,
    openTab
}) {

    const [assessments, setExams] =
        useState([]);

    const [creatingExam,
        setCreatingExam] =
        useState(false);

    const [assessmentToArchive,
        setExamToArchive] =
        useState(null);

    const [archiveOpen,
        setArchiveOpen] =
        useState(false);

    const loadExams = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/assessments`,
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

            setExams(data);

        } catch (error) {

            console.error(error);

        }

    };

    useEffect(() => {

        loadExams();

    }, []);

    const handleArchiveExam = (
        assessment
    ) => {

        setExamToArchive(assessment);

        setArchiveOpen(true);

    };

    return (

        <>

            <BaseTabLayout

                title="Provbank"

                actions={

                    <Button
                        onClick={() =>
                            setCreatingExam(
                                true
                            )
                        }
                    >
                        Nytt prov
                    </Button>

                }

            >

                <div
                    className="
                        grid
                        gap-4
                        grid-cols-1
                        md:grid-cols-2
                        xl:grid-cols-3
                    "
                >

                    {assessments.map(assessment => (

                        <ExamCard
                            key={assessment.id}
                            assessment={assessment}
                            selected={
                                selectedExamId === assessment.id
                            }
                            openTab={openTab}
                            onArchive={
                                handleArchiveExam
                            }
                        />
                    ))}

                </div>

            </BaseTabLayout>

            <ArchiveExamDialog
                assessment={assessmentToArchive}
                open={archiveOpen}
                onOpenChange={
                    setArchiveOpen
                }
                onArchived={loadExams}
            />

            <NewExamDialog
                open={creatingExam}
                onOpenChange={
                    setCreatingExam
                }
            >

                <CreateExam
                    onCreated={(assessment) => {

                        setCreatingExam(false);

                        loadExams();

                        openTab({
                            id: `assessment-${assessment.id}`,
                            title: assessment.title,
                            type: "assessment",
                            assessmentId: assessment.id
                        });

                    }}
                />

            </NewExamDialog>

        </>

    );

}