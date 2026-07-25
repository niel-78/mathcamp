import { useEffect, useState } from "react";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";

export default function ExamList({ onSelect }) {
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        try {
            const res = await fetch(
                `${API_URL}/api/teacher/exams`,
                {
                    headers: authHeaders()
                }
            );

            const data = await res.json();

            setExams(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Laddar prov...</p>;
    }


    const createExam = async () => {

        const res = await fetch(
            `${API_URL}/api/teacher/exams`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    title: "Nytt prov"
                })
            }
        );

        const exam = await res.json();

        onSelect(exam.id);
    };

    const copyExam = async (examToCopy) => {

        console.log(examToCopy);

        const res = await fetch(
            `${API_URL}/api/teacher/exams/${examToCopy.id}/copy`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    title: examToCopy.name + " (kopia)"
                })
            }
        );

        const exam = await res.json();

        onSelect(exam.id);
    };


    const deleteExam = async (examId) => {

        const confirmed = window.confirm(
            "Är du säker på att du vill ta bort provet?"
        );

        if (!confirmed) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/${examId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            }
        );

        loadExams();
    };


    return (
    <div className="card">

        <h2>Mina prov</h2>

        <div className="flex gap-2 mb-4">

            <button
                className="btn-primary"
                onClick={createExam}
            >
                Skapa prov
            </button>

        </div>

        <table className="table">

            <thead>
                <tr>
                    <th>Titel</th>
                    <th>Ägare</th>
                </tr>
            </thead>

            <tbody>

                {exams.map(exam => (
                    <tr
                        key={exam.id}
                        onClick={() =>
                            onSelect(exam.id)
                        }
                    >
                        <td>{exam.title}</td>

                        <td>
                            {exam.is_owner
                                ? "Ja"
                                : "Nej"}
                        </td>
                    </tr>
                ))}

            </tbody>

        </table>

    </div>)
}
