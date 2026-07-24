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
        <div className="card">

            <div className="flex justify-between items-center mb-6">

                <div>
                    {editMode ? (
                        <input
                            className="input-standard"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            onBlur={() =>
                                saveExam(title)
                            }
                        />
                    ) : (
                        <h2 className="text-2xl font-bold">
                            {exam.title}
                        </h2>
                    )}
                </div>

                <div className="flex gap-2">

                    <button
                        className="btn-action"
                        onClick={() =>
                            setEditMode(!editMode)
                        }
                    >
                        {editMode
                            ? "Klar"
                            : "Redigera"}
                    </button>

                    <button
                        className="btn-primary"
                        onClick={onClose}
                    >
                        Tillbaka
                    </button>

                </div>

            </div>

            <div className="space-y-4">

                {exam.blocks.map(block => (

                    <Block
                        key={block.id}
                        block={block}
                        exam={exam}
                        onChanged={loadExam}
                        editMode={editMode}
                    />

                ))}

            </div>

            <div className="mt-6 border-t pt-6">

                {editMode && (

                    <div className="flex gap-2">

                        <input
                            className="input-standard"
                            value={newBlock}
                            placeholder="Nytt block..."
                            onChange={(e) =>
                                setNewBlock(
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    createBlock();
                                }
                            }}
                        />

                        <button
                            className="btn-primary"
                            onClick={createBlock}
                        >
                            Lägg till block
                        </button>

                    </div>

                )}

                <div className="flex justify-end gap-2 mt-4">

                    <button
                        className="btn-action"
                        onClick={() =>
                            setEditMode(!editMode)
                        }
                    >
                        {editMode
                            ? "Klar"
                            : "Redigera"}
                    </button>

                    <button
                        className="btn-primary"
                        onClick={onClose}
                    >
                        Tillbaka
                    </button>

                </div>

            </div>

        </div>
    )
}
export default ExamEditor;