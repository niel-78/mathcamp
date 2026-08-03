import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import ExamCard from "@/components/ui/ExamCard";
import CreateExam from "@/components/ui/CreateExam";

export default function ExamListTab({
    selectedExamId,
    onSelectExam,
    openTab

}) {

    const [exams, setExams] =
        useState([]);

    const loadExams = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/teacher/exams`,
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

    return (

        <div className="space-y-4">

            <CreateExam
                onCreated={() => {

                    loadExams();

                }}
            />

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
                    onClick={() =>
                        onSelectExam(exam.id)
                    }
                />

            ))}

            </div>

        </div>

    );

}