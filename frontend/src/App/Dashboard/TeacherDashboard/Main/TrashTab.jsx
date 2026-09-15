import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { getBlockIssues, getQuestionIssues } from "@/utils/getQuestionIssues";
import ArchiveDates from "@/components/ui/ArchiveDates";
import ArchiveToolbar from "@/components/ui/ArchiveToolbar";

const trashConfigs = {
    groups: {
        label: "Grupper",
        endpoint: "groups",
        getName: item => item.name,
        empty: "Inga soft-raderade grupper."
    },
    students: {
        label: "Elever i grupper",
        endpoint: "students",
        getName: item => `${item.first_name} ${item.last_name}`,
        getDetails: item => `Grupp: ${item.group_name}`,
        getGroups: item => [item.group_name],
        empty: "Inga soft-raderade elever.",
        restoreBody: item => ({
            group_id: item.group_id,
            user_id: item.id
        }),
        permanentBody: item => ({
            group_id: item.group_id,
            user_id: item.id
        })
    },
    blocks: {
        label: "Block",
        endpoint: "blocks",
        getName: item => `Block #${item.id}`,
        getDetails: item => {
            const questionCount = item.question_count ?? item.questions?.length ?? 0;
            return `${questionCount} ${questionCount === 1 ? "uppgift" : "uppgifter"}`;
        },
        getPreview: item => item.questions?.[0]?.question,
        getIssues: item => getBlockIssues(item, true),
        getCourses: item => (item.courses || []).map(value => value.name),
        getBooks: item => (item.books || []).map(value => value.title),
        empty: "Inga soft-raderade block."
    },
    questions: {
        label: "Uppgifter",
        endpoint: "questions",
        getName: item => `Uppgift #${item.id}`,
        getDetails: item => `Block: ${item.block_id}`,
        getPreview: item => item.question,
        getIssues: item => getQuestionIssues(item, null, true),
        getCourses: item => (item.course_names || "").split(", ").filter(Boolean),
        getBooks: item => (item.book_names || "").split(", ").filter(Boolean),
        getMetadata: item => [
            item.level_name && `Nivå: ${item.level_name}`,
            item.course_names && `Kurser: ${item.course_names}`,
            item.book_names && `Böcker: ${item.book_names}`
        ].filter(Boolean),
        empty: "Inga soft-raderade uppgifter."
    },
    assessments: {
        label: "Prov",
        endpoint: "assessments",
        getName: item => item.title,
        empty: "Inga soft-raderade prov."
    },
    presentations: {
        label: "Presentationer",
        endpoint: "presentations",
        getName: item => item.title,
        empty: "Inga soft-raderade presentationer."
    }
};

export default function TrashTab({ kind }) {
    const config = trashConfigs[kind];
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("updated_at");
    const [course, setCourse] = useState("");
    const [book, setBook] = useState("");
    const [category, setCategory] = useState("");

    const loadItems = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/archive/${config.endpoint}/trash`,
                { headers: authHeaders() }
            );

            if (response.ok) {
                setItems(await response.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [kind]);

    const restoreItem = async item => {
        const options = {
            method: "POST",
            headers: {
                ...authHeaders(),
                ...(config.restoreBody && {
                    "Content-Type": "application/json"
                })
            }
        };

        if (config.restoreBody) {
            options.body = JSON.stringify(config.restoreBody(item));
        }

        const response = await fetch(
            `${API_URL}/api/archive/${config.endpoint}/${
                config.endpoint === "students" ? "restore" : `${item.id}/restore`
            }`,
            options
        );

        if (response.ok) {
            await loadItems();
        }
    };

    const permanentlyDeleteItem = async item => {
        const name = config.getName(item);

        if (!window.confirm(
            `Vill du radera ${name} permanent? Detta kan inte ångras.`
        )) {
            return;
        }

        const options = {
            method: "DELETE",
            headers: {
                ...authHeaders(),
                ...(config.permanentBody && {
                    "Content-Type": "application/json"
                })
            }
        };

        if (config.permanentBody) {
            options.body = JSON.stringify(config.permanentBody(item));
        }

        const response = await fetch(
            `${API_URL}/api/archive/${config.endpoint}/${
                config.endpoint === "students" ? "permanent" : `${item.id}/permanent`
            }`,
            options
        );

        if (response.ok) {
            await loadItems();
        } else {
            window.alert(
                "Posten kunde inte raderas permanent eftersom den har kvarvarande kopplingar."
            );
        }
    };

    const courses = [...new Set(
        items.flatMap(item => config.getCourses?.(item) || [])
    )].sort();

    const books = [...new Set(
        items.flatMap(item => config.getBooks?.(item) || [])
    )].sort();

    const categories = [...new Set(
        items.flatMap(item => config.getGroups?.(item) || [])
    )].sort();

    const visibleItems = items
        .filter(item => {
            const text = [
                config.getName(item),
                config.getDetails?.(item),
                config.getPreview?.(item),
                ...(config.getCourses?.(item) || []),
                ...(config.getBooks?.(item) || [])
            ].filter(Boolean).join(" ").toLowerCase();

            return (
                text.includes(query.toLowerCase()) &&
                (!course || (config.getCourses?.(item) || []).includes(course)) &&
                (!book || (config.getBooks?.(item) || []).includes(book))
                && (!category || (config.getGroups?.(item) || []).includes(category))
            );
        })
        .sort((first, second) =>
            new Date(
                second[sortBy] || second.deleted_at || second.archived_at || second.created_at || 0
            ) - new Date(
                first[sortBy] || first.deleted_at || first.archived_at || first.created_at || 0
            )
        );

    return (
        <BaseTabLayout title={`Papperskorg - ${config.label}`}>
            <CardSection
                title={`Soft-raderade ${config.label.toLowerCase()}`}
                description="Poster som kan återställas."
            >
                <div className={config.getGroups || config.getCourses || config.getBooks
                    ? "w-full max-w-5xl justify-self-start"
                    : "contents"}
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
                    category={category}
                    setCategory={config.getGroups ? setCategory : undefined}
                    categories={categories}
                    categoryLabel="Grupp"
                    stacked={Boolean(config.getGroups)}
                />

                {loading && <div>Laddar...</div>}

                {!loading && items.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                        {config.empty}
                    </div>
                )}

                <div className="space-y-4">
                    {visibleItems.map(item => (
                        <div
                            key={config.endpoint === "students"
                                ? `${item.group_id}-${item.id}`
                                : item.id}
                            className="border rounded-lg p-4 flex items-center justify-between"
                        >
                            <div>
                                <div className="font-medium">
                                    {config.getName(item)}
                                </div>
                                {config.getDetails && (
                                    <div className="text-sm text-muted-foreground">
                                        {config.getDetails(item)}
                                    </div>
                                )}
                                <ArchiveDates item={item} />
                                {config.getPreview && config.getPreview(item) && (
                                    <MathContent
                                        value={config.getPreview(item)}
                                        className="mt-2"
                                    />
                                )}
                                {(config.getMetadata?.(item) ?? []).map(metadata => (
                                    <div
                                        key={metadata}
                                        className="text-sm text-muted-foreground"
                                    >
                                        {metadata}
                                    </div>
                                ))}
                                {(config.getIssues?.(item) ?? []).length > 0 && (
                                    <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-1.5">
                                        <div className="flex items-center gap-1.5 font-semibold">
                                            <AlertCircle size={14} />
                                            <span>
                                                {config.getIssues(item).length} fel
                                            </span>
                                        </div>
                                        <ul className="list-disc list-inside space-y-0.5 opacity-90">
                                            {config.getIssues(item).map(issue => (
                                                <li key={`${issue.questionId}-${issue.type}`}>
                                                    {issue.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {config.endpoint === "blocks" && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                        {item.courses?.map(course => (
                                            <Badge
                                                key={`course-${course.id}`}
                                                variant="secondary"
                                                className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-medium"
                                            >
                                                <GraduationCap size={12} className="mr-1" />
                                                {course.name}
                                            </Badge>
                                        ))}

                                        {item.books?.map(book => (
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
                                {item.deleted_at && (
                                    <div className="text-sm text-muted-foreground">
                                        Raderad: {new Date(item.deleted_at).toLocaleString("sv-SE")}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => restoreItem(item)}
                                >
                                    Återställ
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => permanentlyDeleteItem(item)}
                                >
                                    Radera permanent
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                </div>
            </CardSection>
        </BaseTabLayout>
    );
}
