import { useEffect, useState } from "react";
import { authHeaders } from "../../../api/authHeaders";
import { API_URL } from "../../../config";
import "./ExamList.css";

export default function ExamList({ onSelect }) {
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        console.log("load exams");
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
        <div className="examList">
            <h2>Mina prov</h2>

            {exams.length === 0 && (
                <p>Du har inga prov.</p>
            )}

            <ul>
                {exams.map(exam => (
                    <li key={exam.id}>


                        <button
                            key={exam.id}
                            onClick={() => onSelect(exam.id)}
                        >
                            {exam.title}
                            {exam.is_owner && (
                                <span> (Ägare)</span>
                            )}
                        </button>
                        {exam.is_owner && (
                            <button
                                onClick={() => deleteExam(exam.id)}
                            >
                                Ta bort
                            </button>
                        )}
    
                    </li>
                ))}
                <li key="ny">
                    <button onClick={createExam}>
                        Nytt prov
                    </button>
                </li>
            </ul>
        </div>
    );
}
