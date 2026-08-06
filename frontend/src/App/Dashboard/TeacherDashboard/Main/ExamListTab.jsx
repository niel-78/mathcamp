import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";

import ExamCard from "@/components/ui/ExamCard";
import CreateExam from "@/components/ui/CreateExam";

import NewExamDialog from "@/components/ui/NewExamDialog";
import DeleteExamDialog from "@/components/ui/DeleteExamDialog";

import BaseTabLayout from "@/components/layouts/BaseTabLayout";

export default function ExamListTab({
    selectedExamId,
    openTab
}) {

    const [exams, setExams] =
        useState([]);

    const [creatingExam,
        setCreatingExam] =
        useState(false);

    const [examToDelete,
        setExamToDelete] =
        useState(null);

    const [deleteOpen,
        setDeleteOpen] =
        useState(false);

    const loadExams = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/exams`,
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

    const handleDeleteExam = (
        exam
    ) => {

        setExamToDelete(exam);

        setDeleteOpen(true);

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

                    {exams.map(exam => (

                        <ExamCard
                            key={exam.id}
                            exam={exam}
                            selected={
                                selectedExamId ===
                                exam.id
                            }
                            openTab={openTab}
                            onDelete={
                                handleDeleteExam
                            }
                        />

                    ))}

                </div>

            </BaseTabLayout>

            <DeleteExamDialog
                exam={examToDelete}
                open={deleteOpen}
                onOpenChange={
                    setDeleteOpen
                }
                onDeleted={loadExams}
            />

            <NewExamDialog
                open={creatingExam}
                onOpenChange={
                    setCreatingExam
                }
            >

                <CreateExam
                    onCreated={(exam) => {

                        console.log(
                            "received in ExamListTab",
                            exam
                        );

                        setCreatingExam(false);

                        loadExams();

                        openTab({
                            id: `exam-${exam.id}`,
                            title: exam.title,
                            type: "exam",
                            examId: exam.id
                        });

                    }}
                />

            </NewExamDialog>

        </>

    );

}