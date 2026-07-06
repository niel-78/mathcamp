import { useEffect, useState } from "react";
import { authHeaders } from "../../../api/authHeaders";
import { API_URL } from "../../../config";
import Block from "./ExamEditor/Block";

function ExamEditor({examId, onClose}) {
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newBlock, setNewBlock] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [title, setTitle] = useState("");

    useEffect(() => {
        loadExam();
    }, []);


    useEffect(() => {
        if (exam) {
            setTitle(exam.title);
        }
    }, [exam]);


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


    const saveExam = async (value) => {

        await fetch(
            `${API_URL}/api/teacher/exams/${exam.id}`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: value
                })
            }
        );

        loadExam();
    };


    const createBlock = async () => {

        if (!newBlock.trim()) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/exams/${exam.id}/blocks`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: newBlock
                })
            }
        );

        setNewBlock("");

        loadExam();
    };



    if(!exam){
        return <p>Laddar...</p>;
    }


    return (
        <>
            {
                editMode ? (
                    <input
                        value={title}
                        onChange={(e) =>
                            setTitle(e.target.value)
                        }
                        onBlur={() =>
                            saveExam(title)
                        }
                    />
                ) : (
                    <h2>{exam.title}</h2>
                )
            }

            <button
                onClick={() => setEditMode(!editMode)}
            >
                {editMode ? "Klar" : "Redigera"}
            </button>


            <button onClick={onClose}>
                Tillbaka
            </button>

            {exam.blocks.map(block => (

                <Block
                    key={block.id}
                    block={block}
                    examId={exam.id}
                    onChanged={loadExam}
                    editMode={editMode}
                />

            ))}


            <div>
                <input
                    value={newBlock}
                    placeholder="Nytt block..."
                    onChange={(e) => setNewBlock(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            createBlock();
                        }
                    }}
                />

                <button onClick={createBlock}>
                    Lägg till block
                </button>
            </div>


        </>
    );

}

export default ExamEditor;