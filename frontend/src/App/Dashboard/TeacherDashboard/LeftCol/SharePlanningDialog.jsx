import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SharePlanningDialog({
    open,
    onOpenChange,
    groupId
}) {

    const [link, setLink] =
        useState(null);

    const loadLink =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/groups/${groupId}/share-link`,
                    {
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            setLink(
                await response.json()
            );

        };

    useEffect(() => {

        if (
            open &&
            groupId
        ) {
            loadLink();
        }

    }, [open, groupId]);

    const createNewLink =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/groups/${groupId}/share-link`,
                    {
                        method: "POST",
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            setLink(
                await response.json()
            );

            toast.success(
                "Ny länk skapad"
            );

        };

    const revokeLink =
        async () => {

            if (!link) {
                return;
            }

            await fetch(
                `${API_URL}/api/groups/share-link/${link.id}`,
                {
                    method: "DELETE",
                    headers:
                        authHeaders()
                }
            );

            setLink(null);

            toast.success(
                "Länken återkallades"
            );

        };

    const copyLink =
        async () => {

            if (!link?.url) {
                return;
            }

            await navigator.clipboard.writeText(
                link.url
            );

            toast.success(
                "Länken kopierad"
            );

        };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Delad planering
                    </DialogTitle>

                </DialogHeader>

                {link ? (

                    <div className="space-y-3">

                        <input
                            readOnly
                            value={link.url}
                            className="
                                w-full
                                border
                                rounded
                                p-2
                            "
                        />

                        <Button
                            className="w-full"
                            onClick={copyLink}
                        >
                            Kopiera länk
                        </Button>

                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={createNewLink}
                        >
                            Skapa ny länk
                        </Button>

                        <Button
                            className="w-full"
                            variant="destructive"
                            onClick={revokeLink}
                        >
                            Återkalla länk
                        </Button>

                    </div>

                ) : (

                    <Button
                        className="w-full"
                        onClick={createNewLink}
                    >
                        Skapa delningslänk
                    </Button>

                )}

            </DialogContent>

        </Dialog>

    );

}