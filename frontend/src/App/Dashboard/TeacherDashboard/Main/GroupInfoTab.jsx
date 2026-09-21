import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import GroupResultsTab from "./GroupResultsTab";
import AddStudentDialog from "./GroupStudentsTab/AddStudentDialog";

const formatDate = (value) => {
    if (!value) {
        return "Aldrig";
    }

    return new Date(value).toLocaleString("sv-SE");
};

export default function GroupInfoTab({ groupId }) {

    const [group, setGroup] = useState(null);
    const [view, setView] = useState("info");
    const [sort, setSort] = useState({
        key: "name",
        direction: "asc"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddStudent, setShowAddStudent] = useState(false);

    const loadGroup = async () => {

        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/groups/${groupId}`,
                {
                    headers: authHeaders()
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Kunde inte läsa gruppen.");
            }

            setGroup(data);
        } catch (loadError) {
            console.error(loadError);
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroup();
    }, [groupId]);

    const sortStudents = (key) => {
        setSort(currentSort => ({
            key,
            direction:
                currentSort.key === key && currentSort.direction === "asc"
                    ? "desc"
                    : "asc"
        }));
    };

    const sortedStudents = [...(group?.students || [])].sort(
        (firstStudent, secondStudent) => {
            const firstValue = firstStudent[sort.key];
            const secondValue = secondStudent[sort.key];

            if (firstValue === secondValue) {
                return 0;
            }

            if (firstValue === null || typeof firstValue === "undefined") {
                return 1;
            }

            if (secondValue === null || typeof secondValue === "undefined") {
                return -1;
            }

            const comparison = sort.key === "last_login"
                ? new Date(firstValue) - new Date(secondValue)
                : typeof firstValue === "string"
                    ? firstValue.localeCompare(secondValue, "sv")
                    : firstValue - secondValue;

            return sort.direction === "asc" ? comparison : -comparison;
        }
    );

    const SortButton = ({ label, sortKey }) => {
        const isActive = sort.key === sortKey;
        const SortIcon = !isActive
            ? ArrowUpDown
            : sort.direction === "asc"
                ? ArrowUp
                : ArrowDown;

        return (
            <button
                type="button"
                className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                onClick={() => sortStudents(sortKey)}
                title={`Sortera ${label.toLowerCase()} ${
                    isActive && sort.direction === "asc" ? "fallande" : "stigande"
                }`}
            >
                {label}
                <SortIcon className="h-4 w-4" />
            </button>
        );
    };

    if (loading) {
        return <p className="p-6">Laddar gruppinformation...</p>;
    }

    if (error) {
        return <p className="p-6 text-destructive">{error}</p>;
    }

    if (view === "results") {
        return (
            <div className="h-full overflow-y-auto bg-slate-50 p-6">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <div>
                        <h1 className="text-2xl font-semibold">{group.name}</h1>
                        <div className="mt-4 flex gap-2">
                            <Button variant="ghost" onClick={() => setView("info")}>
                                Information
                            </Button>
                            <Button onClick={() => setView("results")}>
                                Resultat
                            </Button>
                        </div>
                    </div>
                    <GroupResultsTab groupId={groupId} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-5xl space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">{group.name}</h1>
                    <p className="text-sm text-muted-foreground">Gruppinformation</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button onClick={() => setView("info")}>Information</Button>
                        <Button variant="ghost" onClick={() => setView("results")}>
                            Resultat
                        </Button>
                    </div>
                </div>

                <dl className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm text-muted-foreground">Bok</dt>
                        <dd className="font-medium">{group.book_title || "Ingen bok"}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-muted-foreground">Förmågaserie</dt>
                        <dd className="font-medium">
                            {group.ability_series_name || "Ingen förmågaserie"}
                        </dd>
                    </div>
                </dl>

                <section className="rounded-xl border bg-white p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold">
                            Elever ({group.students?.length || 0})
                        </h2>
                        <Button onClick={() => setShowAddStudent(true)}>
                            Lägg till elev
                        </Button>
                    </div>

                    {!group.students?.length && (
                        <p className="text-sm text-muted-foreground">
                            Gruppen har inga elever.
                        </p>
                    )}

                    {!!group.students?.length && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2">
                                            <SortButton label="Elev" sortKey="name" />
                                        </th>
                                        <th className="px-3 py-2">
                                            <SortButton
                                                label="Användarnamn"
                                                sortKey="username"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <SortButton
                                                label="Senast inloggad"
                                                sortKey="last_login"
                                            />
                                        </th>
                                        <th className="px-3 py-2">
                                            <SortButton
                                                label="Antal inloggningar"
                                                sortKey="login_count"
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStudents.map(student => (
                                        <tr key={student.id} className="border-b last:border-0">
                                            <td className="px-3 py-3 font-medium">
                                                {student.display_name ||
                                                    `${student.first_name} ${student.last_name}`}
                                            </td>
                                            <td className="px-3 py-3">{student.username}</td>
                                            <td className="px-3 py-3">
                                                {formatDate(student.last_login)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {student.login_count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
            <AddStudentDialog
                open={showAddStudent}
                onOpenChange={setShowAddStudent}
                groupId={groupId}
                onCreated={loadGroup}
            />
        </div>
    );
}