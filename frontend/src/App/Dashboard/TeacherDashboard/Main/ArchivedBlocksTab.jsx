import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import BaseTabLayout
    from "@/components/layouts/BaseTabLayout";

import CardSection
    from "@/components/layouts/CardSection";

import { Button }
    from "@/components/ui/button";

import DeleteBlockDialog
    from "@/components/ui/DeleteBlockDialog";

import MathContent
    from "@/components/ui/MathContent";

import { Badge }
    from "@/components/ui/badge";

import { AlertCircle, BookOpen, GraduationCap }
    from "lucide-react";

import { getBlockIssues }
    from "@/utils/getQuestionIssues";
import ArchiveDates
    from "@/components/ui/ArchiveDates";

import ArchiveToolbar
    from "@/components/ui/ArchiveToolbar";

function IssueDetails({ issues }) {
    if (!issues.length) {
        return null;
    }

    return (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle size={14} />
                <span>Varningar i blocket ({issues.length} st):</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
                {issues.map(issue => (
                    <li key={`${issue.questionId}-${issue.type}`}>
                        {issue.message}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function ArchivedBlocksTab() {

    const [blocks, setBlocks] = useState([]);

    const [loading, setLoading] = useState(true);

    const [blockToDelete, setBlockToDelete] = useState(null);
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("updated_at");
    const [course, setCourse] = useState("");
    const [book, setBook] = useState("");

    useEffect(() => {

        loadBlocks();

    }, []);

    const loadBlocks = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/blocks`,
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

            setBlocks(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    const restoreBlock = async (
        blockId
    ) => {

        try {

            await fetch(
                `${API_URL}/api/archive/blocks/${blockId}/restore`,
                {
                    method: "POST",
                    headers:
                        authHeaders()
                }
            );

            window.dispatchEvent(
                new Event("blocks-changed")
            );

            await loadBlocks();

        } catch (error) {

            console.error(error);

        }

    };

    const deleteBlock = async () => {

        if (!blockToDelete) {
            return;
        }

        try {

            await fetch(
                `${API_URL}/api/archive/blocks/${blockToDelete.id}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            setBlockToDelete(null);

            await loadBlocks();

        } catch (error) {

            console.error(error);

        }

    };

    const courses = [...new Set(
        blocks.flatMap(block => (block.courses || []).map(item => item.name))
    )].sort();

    const books = [...new Set(
        blocks.flatMap(block => (block.books || []).map(item => item.title))
    )].sort();

    const visibleBlocks = blocks
        .filter(block => {
            const text = [
                block.id,
                block.questions?.[0]?.question,
                ...(block.courses || []).map(item => item.name),
                ...(block.books || []).map(item => item.title)
            ].filter(Boolean).join(" ").toLowerCase();

            return (
                text.includes(query.toLowerCase()) &&
                (!course || block.courses?.some(item => item.name === course)) &&
                (!book || block.books?.some(item => item.title === book))
            );
        })
        .sort((first, second) =>
            new Date(second[sortBy] || 0) - new Date(first[sortBy] || 0)
        );

    return (

        <>
            <BaseTabLayout
                title="Arkiverade block"
            >

                <CardSection
                    title="Arkiverade block"
                    description="Block som du har skapat och arkiverat."
                >

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
                    blocks.length === 0 && (

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Inga arkiverade block.
                        </div>

                    )}

                    <div className="space-y-4">

                        {visibleBlocks.map(block => (

                            <div
                                key={block.id}
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
                                        Block #{block.id}
                                    </div>

                                    <div
                                        className="
                                            text-sm
                                            text-muted-foreground
                                        "
                                    >
                                        Synlighet:
                                        {" "}
                                        {block.visibility}
                                    </div>

                                    <ArchiveDates item={block} />

                                    <div className="text-sm text-muted-foreground">
                                        {block.question_count ?? block.questions?.length ?? 0}
                                        {" "}
                                        {(block.question_count ?? block.questions?.length ?? 0) === 1
                                            ? "uppgift"
                                            : "uppgifter"}
                                    </div>

                                    {block.questions?.[0]?.question && (
                                        <MathContent
                                            value={block.questions[0].question}
                                            className="mt-2"
                                        />
                                    )}

                                    {(block.courses?.length > 0 ||
                                        block.books?.length > 0) && (
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                            {block.courses?.map(course => (
                                                <Badge
                                                    key={`course-${course.id}`}
                                                    variant="secondary"
                                                    className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-medium"
                                                >
                                                    <GraduationCap size={12} className="mr-1" />
                                                    {course.name}
                                                </Badge>
                                            ))}

                                            {block.books?.map(book => (
                                                <Badge
                                                    key={`book-${book.id}`}
                                                    variant="outline"
                                                    className="text-xs bg-amber-50 text-amber-850 border-amber-200/80 font-normal"
                                                >
                                                    <BookOpen size={12} className="mr-1" />
                                                    {book.title}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    <IssueDetails
                                        issues={getBlockIssues(block, true)}
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
                                            restoreBlock(
                                                block.id
                                            )
                                        }
                                    >
                                        Återställ
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setBlockToDelete(
                                                block
                                            )
                                        }
                                    >
                                        Radera
                                    </Button>

                                </div>

                            </div>

                        ))}

                    </div>

                </CardSection>

            </BaseTabLayout>

            <DeleteBlockDialog
                open={!!blockToDelete}
                onOpenChange={(open) => {

                    if (!open) {
                        setBlockToDelete(null);
                    }

                }}
                onDelete={deleteBlock}
            />

        </>
    );

}