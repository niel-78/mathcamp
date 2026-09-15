import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import DeleteQuestionDialog from "@/components/ui/DeleteQuestionDialog";
import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";
import { AlertCircle } from "lucide-react";
import { getQuestionIssues } from "@/utils/getQuestionIssues";
import ArchiveDates from "@/components/ui/ArchiveDates";
import ArchiveToolbar from "@/components/ui/ArchiveToolbar";

function IssueDetails({ issues }) {
    if (!issues.length) {
        return null;
    }

    return (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle size={14} />
                <span>{issues.length} fel</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
                {issues.map(issue => (
                    <li key={issue.type}>{issue.message}</li>
                ))}
            </ul>
        </div>
    );
}

export default function ArchivedQuestionsTab() {

    const [questions, setQuestions] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [questionToDelete,
        setQuestionToDelete] =
        useState(null);

    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("updated_at");
    const [course, setCourse] = useState("");
    const [book, setBook] = useState("");

    useEffect(() => {

        loadQuestions();

    }, []);

    const loadQuestions = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/questions`,
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

            setQuestions(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    const restoreQuestion = async (
        questionId
    ) => {

        try {

            await fetch(
                `${API_URL}/api/archive/questions/${questionId}/restore`,
                {
                    method: "POST",
                    headers:
                        authHeaders()
                }
            );

            window.dispatchEvent(
                new Event("questions-changed")
            );

            await loadQuestions();

        } catch (error) {

            console.error(error);

        }

    };

    const deleteQuestion = async () => {

        if (!questionToDelete) {
            return;
        }

        try {

            await fetch(
                `${API_URL}/api/archive/questions/${questionToDelete.id}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            setQuestionToDelete(null);

            await loadQuestions();

        } catch (error) {

            console.error(error);

        }

    };

    const courses = [...new Set(
        questions.flatMap(question =>
            (question.course_names || "").split(", ").filter(Boolean)
        )
    )].sort();

    const books = [...new Set(
        questions.flatMap(question =>
            (question.book_names || "").split(", ").filter(Boolean)
        )
    )].sort();

    const visibleQuestions = questions
        .filter(question => {
            const text = [
                question.id,
                question.question,
                question.level_name,
                question.course_names,
                question.book_names
            ].filter(Boolean).join(" ").toLowerCase();

            return (
                text.includes(query.toLowerCase()) &&
                (!course || question.course_names?.split(", ").includes(course)) &&
                (!book || question.book_names?.split(", ").includes(book))
            );
        })
        .sort((first, second) =>
            new Date(second[sortBy] || 0) - new Date(first[sortBy] || 0)
        );


    return (

        <>
            <BaseTabLayout
                title="Arkiverade uppgifter"
            >

                <CardSection
                    title="Arkiverade uppgifter"
                    description="Uppgifter från dina block som har arkiverats."
                >

                    <div className="w-full max-w-5xl justify-self-start">

                    <ArchiveToolbar
                        query={query}
                        setQuery={setQuery}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        course={course}
                        setCourse={setCourse}
                        book={book}
                        setBook={setBook}
                        courses={courses}
                        books={books}
                    />

                    {loading && (

                        <div>
                            Laddar...
                        </div>

                    )}

                    {!loading &&
                    questions.length === 0 && (

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Inga arkiverade uppgifter.
                        </div>

                    )}

                    <div className="space-y-4">

                        {visibleQuestions.map(question => (

                            <div
                                key={question.id}
                                className="
                                    border
                                    rounded-lg
                                    p-4

                                    flex
                                    items-center
                                    justify-between
                                "
                            >

                                <div>

                                    <div
                                        className="
                                            font-medium
                                        "
                                    >
                                        Uppgift #{question.id}
                                    </div>

                                    <div
                                        className="
                                            text-sm
                                            text-muted-foreground
                                        "
                                    >
                                        Block:
                                        {" "}
                                        {question.block_id}
                                    </div>

                                    <ArchiveDates item={question} />

                                    {question.question && (
                                        <MathContent
                                            value={question.question}
                                            className="mt-2"
                                        />
                                    )}

                                    {question.level_name && (
                                        <div className="text-sm text-muted-foreground mt-2">
                                            Nivå: {question.level_name}
                                        </div>
                                    )}

                                    {question.course_names && (
                                        <div className="text-sm text-muted-foreground">
                                            Kurser: {question.course_names}
                                        </div>
                                    )}

                                    {question.book_names && (
                                        <div className="text-sm text-muted-foreground">
                                            Böcker: {question.book_names}
                                        </div>
                                    )}

                                    <IssueDetails
                                        issues={getQuestionIssues(
                                            question,
                                            null,
                                            true
                                        )}
                                    />

                                </div>

                                <div
                                    className="
                                        flex
                                        gap-2
                                    "
                                >

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            restoreQuestion(
                                                question.id
                                            )
                                        }
                                    >
                                        Återställ
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setQuestionToDelete(
                                                question
                                            )
                                        }
                                    >
                                        Radera
                                    </Button>

                                </div>

                            </div>

                        ))}

                    </div>

                    </div>

                </CardSection>

            </BaseTabLayout>

            <DeleteQuestionDialog
                open={!!questionToDelete}
                onOpenChange={(open) => {

                    if (!open) {

                        setQuestionToDelete(null);

                    }

                }}
                onDelete={deleteQuestion}
            />

        </>
    );

}