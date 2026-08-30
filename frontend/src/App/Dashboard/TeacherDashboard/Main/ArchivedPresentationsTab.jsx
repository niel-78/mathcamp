import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { Button } from "@/components/ui/button";

export default function ArchivedPresentationsTab({
    openTab
}) {

    const [
        presentations,
        setPresentations
    ] = useState([]);

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

    return (

        <BaseTabLayout
            title="Arkiverade presentationer"
        >

            <div className="space-y-2">

                {presentations.map(
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