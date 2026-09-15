import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import ArchiveDates from "@/components/ui/ArchiveDates";
import ArchiveToolbar from "@/components/ui/ArchiveToolbar";

export default function ArchivedStudentsTab() {

    const [students, setStudents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("deleted_at");
    const [group, setGroup] = useState("");

    useEffect(() => {

        loadStudents();

    }, []);

    const loadStudents = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/students`,
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

            setStudents(data);

        } finally {

            setLoading(false);

        }

    };

    const restoreStudent = async (groupId, userId) => {

        try {

            await fetch(
                `${API_URL}/api/archive/students/restore`,
                {
                    method: "POST",

                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        group_id: groupId,
                        user_id: userId
                    })
                }
            );

            await loadStudents();

            window.dispatchEvent(
                new Event("groups-changed")
            );

        } catch (error) {

            console.error(error);

        }

};

    const visibleStudents = students
        .filter(student => `${student.first_name} ${student.last_name} ${student.group_name}`
            .toLowerCase().includes(query.toLowerCase()))
        .filter(student => !group || student.group_name === group)
        .sort((first, second) =>
            new Date(second[sortBy] || second.deleted_at || second.created_at || 0) -
            new Date(first[sortBy] || first.deleted_at || first.created_at || 0)
        );

    const groups = [...new Set(students.map(student => student.group_name))].sort();

    return (

        <BaseTabLayout
            title="Arkiverade elever"
        >

            <CardSection
                title="Arkiverade elever"
                description="Elevens medlemskap i gruppen som tagits bort."
            >

                <div className="w-full max-w-3xl justify-self-start">

                <ArchiveToolbar
                    query={query}
                    setQuery={setQuery}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    showCourseBookFilters={false}
                    category={group}
                    setCategory={setGroup}
                    categories={groups}
                    categoryLabel="Grupp"
                    stacked
                />

                {loading && (
                    <div>Laddar...</div>
                )}

                {!loading &&
                students.length === 0 && (

                    <div
                        className="
                            text-sm
                            text-muted-foreground
                        "
                    >
                        Inga borttagna elever.
                    </div>

                )}

                <div className="w-full space-y-4">

                    {visibleStudents.map(student => (

                        <div
                            key={`${student.group_id}-${student.id}`}
                            className="
                                border
                                rounded-lg
                                p-4

                                flex
                                justify-start
                                items-center
                                text-left
                            "
                        >

                            <div>

                                <div className="font-medium">
                                    {student.first_name}
                                    {" "}
                                    {student.last_name}
                                </div>

                                <div
                                    className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                >
                                    Grupp: {student.group_name}
                                </div>

                                <ArchiveDates item={student} />

                            </div>

                            <Button
                                variant="outline"
                                className="ml-auto"
                                onClick={() =>
                                    restoreStudent(
                                        student.group_id,
                                        student.id
                                    )
                                }
                            >
                                Återställ
                            </Button>

                        </div>

                    ))}

                </div>

                </div>

            </CardSection>

        </BaseTabLayout>

    );

}