import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import CardSection from "@/components/layouts/CardSection";
import { Button } from "@/components/ui/button";
import DeleteGroupDialog from "@/components/ui/DeleteGroupDialog";
import ArchiveDates from "@/components/ui/ArchiveDates";
import ArchiveToolbar from "@/components/ui/ArchiveToolbar";

export default function ArchivedGroupsTab() {

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("archived_at");

    useEffect(() => {

        loadGroups();

    }, []);

    const loadGroups = async () => {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/archive/groups`,
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

            setGroups(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    const restoreGroup = async (
        groupId
    ) => {

        try {

            await fetch(
                `${API_URL}/api/archive/groups/${groupId}/restore`,
                {
                    method: "POST",
                    headers:
                        authHeaders()
                }
            );

            await loadGroups();

            window.dispatchEvent(
                new Event("group-restored")
            );

        } catch (error) {

            console.error(error);

        }

    };

    const visibleGroups = groups
        .filter(group => `${group.name} ${group.description || ""}`
            .toLowerCase().includes(query.toLowerCase()))
        .sort((first, second) =>
            new Date(second[sortBy] || second.archived_at || second.created_at || 0) -
            new Date(first[sortBy] || first.archived_at || first.created_at || 0)
        );

    return (
        <>
            <BaseTabLayout
                title="Arkiverade grupper"
            >

                <CardSection
                    title="Arkiverade grupper"
                    description="Grupper som du äger och har arkiverat."
                >

                    <ArchiveToolbar
                        query={query}
                        setQuery={setQuery}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        showCourseBookFilters={false}
                    />

                    {loading && (

                        <div>
                            Laddar...
                        </div>

                    )}

                    {!loading &&
                    groups.length === 0 && (

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Inga arkiverade grupper.
                        </div>

                    )}

                    <div className="space-y-4">

                        {visibleGroups.map(group => (

                            <div
                                key={group.id}
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
                                        {group.name}
                                    </div>

                                    {group.description && (

                                        <div
                                            className="
                                                text-sm
                                                text-muted-foreground
                                            "
                                        >
                                            {group.description}
                                        </div>

                                    )}

                                    <ArchiveDates item={group} />

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
                                            restoreGroup(
                                                group.id
                                            )
                                        }
                                    >
                                        Återställ
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setGroupToDelete(group)
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
            <DeleteGroupDialog
                open={!!groupToDelete}
                group={groupToDelete}
                onOpenChange={(open) => {

                    if (!open) {

                        setGroupToDelete(null);

                    }

                }}
                onDeleted={loadGroups}
            />
        </>   
    );

}