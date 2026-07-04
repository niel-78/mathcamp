import { useEffect, useState } from "react";
import { authHeaders } from "../../../api/authHeaders";
import { API_URL } from "../../../config";
import Block from "./ExamEditor/Block";

function ExamEditor({examId, onClose}) {
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExam();
    }, []);

    const loadExam = async () => {
        console.log("load exam");
        try {
            const res = await fetch(
                `${API_URL}/api/teacher/exams/${examId}/full`,
                {
                    headers: authHeaders()
                }
            );

            const data = await res.json();

            setExam(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const saveTitle = async () => {
        await fetch(
            `${API_URL}/api/teacher/exams/${exam.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    title: exam.title
                })
            }
        );
    };


    if(!exam){
        return <p>Laddar...</p>;
    }


    return (
        <>
            <h2>
                <input
                    value={exam.title}
                    onChange={e =>
                        setExam({
                            ...exam,
                            title: e.target.value
                        })
                    }
                    onBlur={saveTitle}
                />
            </h2>

            <button onClick={onClose}>
                Tillbaka
            </button>

            {exam.blocks.map(block => (
                <Block
                    key={block.id}
                    block={block}
                    onQuestionAdded={loadExam}
                    onQuestionDeleted={loadExam}
                />
            ))}
        </>
    );

}

export default ExamEditor;