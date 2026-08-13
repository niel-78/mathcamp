import { API_URL } from "@/config";
import { toast } from "sonner";
import { authHeaders } from "@/api/authHeaders";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ArchiveBlockDialog({
    block,
    open,
    onOpenChange,
    onArchived
}) {

    const archiveBlock = async () => {

        const response = await fetch(
            `${API_URL}/api/blocks/${block.id}/archive`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        if (!response.ok) {

            toast.error(
                "Kunde inte arkivera blocket"
            );

            return;

        }

        toast.success(
            "Blocket arkiverades"
        );

        window.dispatchEvent(
            new Event("blocks-changed")
        );

        onOpenChange(false);

        onArchived?.();

    };

    return (

        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <AlertDialogContent>

                <AlertDialogHeader>

                    <AlertDialogTitle>
                        Arkivera block
                    </AlertDialogTitle>

                    <AlertDialogDescription>

                        Är du säker på att du vill
                        arkivera detta block?

                        <br />
                        <br />

                        Blocket flyttas till Arkiv
                        och kan återställas senare.

                    </AlertDialogDescription>

                </AlertDialogHeader>

                <AlertDialogFooter>

                    <AlertDialogCancel>
                        Avbryt
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={archiveBlock}
                    >
                        Arkivera
                    </AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent>

        </AlertDialog>

    );

}