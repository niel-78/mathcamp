import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { Button } from "@/components/ui/button";
import ArchiveDates from "@/components/ui/ArchiveDates";
import ArchiveToolbar from "@/components/ui/ArchiveToolbar";

export default function ArchivedPresentationsTab({
    openTab
}) {

    const [
        presentations,
        setPresentations
    ] = useState([]);
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState("archived_at");

    const loadPresentations =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/archive/presentations`,
                    {
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            setPresentations(
                await response.json()
            );

        };

    useEffect(() => {

        loadPresentations();

    }, []);

    const restorePresentation =
        async (presentationId) => {

            const response =
                await fetch(
                    `${API_URL}/api/archive/presentations/${presentationId}/restore`,
                    {
                        method: "POST",
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            loadPresentations();

        };

    const deletePresentation =
        async (presentationId) => {

            if (
                !window.confirm(
                    "Vill du ta bort presentationen permanent?"
                )
            ) {
                return;
            }

            const response =
                await fetch(
                    `${API_URL}/api/archive/presentations/${presentationId}`,
                    {
                        method: "DELETE",
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            loadPresentations();

        };

        const visiblePresentations = presentations
            .filter(presentation => (presentation.title || "")
                .toLowerCase().includes(query.toLowerCase()))
            .sort((first, second) =>
                new Date(second[sortBy] || second.archived_at || second.created_at || 0) -
                new Date(first[sortBy] || first.archived_at || first.created_at || 0)
            );

    return (

        <BaseTabLayout
            title="Arkiverade presentationer"
        >

            <ArchiveToolbar
                query={query}
                setQuery={setQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                showCourseBookFilters={false}
            />

            <div className="space-y-2">

                {visiblePresentations.map(
                    presentation => (

                        <div
                            key={presentation.id}
                            className="
                                flex
                                items-center
                                justify-between
                                rounded-md
                                border
                                p-3
                            "
                        >

                            <div>

                                <div
                                    className="
                                        font-medium
                                    "
                                >
                                    {presentation.title}
                                </div>

                                <div
                                    className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                >
                                    ID: {presentation.id}
                                </div>

                                <ArchiveDates item={presentation} />

                            </div>

                            <div
                                className="
                                    flex
                                    gap-2
                                "
                            >

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        restorePresentation(
                                            presentation.id
                                        )
                                    }
                                >
                                    Återställ
                                </Button>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                        deletePresentation(
                                            presentation.id
                                        )
                                    }
                                >
                                    Ta bort
                                </Button>

                            </div>

                        </div>

                    )
                )}

                {!presentations.length && (

                    <div
                        className="
                            text-muted-foreground
                        "
                    >
                        Inga arkiverade presentationer.
                    </div>

                )}

            </div>

        </BaseTabLayout>

    );

}