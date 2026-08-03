import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function CreateExam({
    onCreated
}) {

    const [title, setTitle] = useState("");
    const [subjects, setSubjects] =
        useState([]);

    const [books, setBooks] =
        useState([]);

    const [subjectId, setSubjectId] =
        useState("");

    const [levelId, setLevelId] =
        useState("");

    const [bookId, setBookId] =
        useState("");

    const canCreateExam =
        title.trim() &&
        subjectId &&
        levelId;

    useEffect(() => {

        const loadData = async () => {

            const [
                subjectsResponse,
                booksResponse
            ] = await Promise.all([

                fetch(
                    `${API_URL}/api/subjects/`,
                    {
                        headers: authHeaders()
                    }
                ),

                fetch(
                    `${API_URL}/api/books`,
                    {
                        headers: authHeaders()
                    }
                )

            ]);

            setSubjects(
                await subjectsResponse.json()
            );

            setBooks(
                await booksResponse.json()
            );

        };

        loadData();

    }, []);

    const createExam = async () => {

        console.log("CREATE EXAM CLICKED");

        console.log({
            title,
            subjectId,
            levelId,
            bookId
        });

        const response = await fetch(
            `${API_URL}/api/exams`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title,
                    subject_id: Number(subjectId),
                    level_id: Number(levelId),
                    book_id: bookId
                        ? Number(bookId)
                        : null
                })
            }
        );

        console.log("status", response.status);

        const exam = await response.json();

        console.log("exam", exam);

        onCreated?.(exam);

    };

    const selectedSubject =
        subjects.find(
            subject =>
                subject.id ===
                Number(subjectId)
        );   

    return (

        <div className="space-y-3">

            <input
                className="input-standard"
                placeholder="Provtitel"
                value={title}
                onChange={(e) =>
                    setTitle(e.target.value)
                }
            />

            <select
                className="input-standard"
                value={subjectId}
                onChange={(e) => {

                    setSubjectId(e.target.value);

                    setLevelId("");

                }}
            >

                <option value="">
                    Välj ämne
                </option>

                {subjects.map(subject => (

                    <option
                        key={subject.id}
                        value={subject.id}
                    >
                        {subject.name}
                    </option>

                ))}

            </select>

            {selectedSubject && (

                <select
                    className="input-standard"
                    value={levelId}
                    onChange={(e) =>
                        setLevelId(
                            e.target.value
                        )
                    }
                >

                    <option value="">
                        Välj nivå
                    </option>

                    {selectedSubject.levels.map(
                        level => (

                            <option
                                key={level.id}
                                value={level.id}
                            >
                                {level.name}
                            </option>

                        )
                    )}

                </select>

            )}

            <select
                className="input-standard"
                value={bookId}
                onChange={(e) =>
                    setBookId(
                        e.target.value
                    )
                }
            >

                <option value="">
                    Ingen bok
                </option>

                {books.map(book => (

                    <option
                        key={book.id}
                        value={book.id}
                    >
                        {book.title}
                    </option>

                ))}

            </select>

            <div className="flex justify-end">

                <Button
                    disabled={!canCreateExam}
                    onClick={createExam}
                >
                    Skapa prov
                </Button>

            </div>

        </div>        

    )    
}