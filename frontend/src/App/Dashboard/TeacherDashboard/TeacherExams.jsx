import { useEffect, useState } from "react";
import { authHeaders } from "../../../api/authHeaders";
import { API_URL } from "../../../config";

export default function TeacherExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div>
            <h2>Mina prov</h2>

            {exams.length === 0 && (
                <p>Du har inga prov.</p>
            )}

            <ul>
                {exams.map(exam => (
                    <li key={exam.id}>
                        <strong>{exam.title}</strong>

                        {exam.is_owner && (
                            <span> (Ägare)</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
