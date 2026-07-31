import { API_URL } from "@/config";
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

export default function ArchiveGroupDialog({
    group,
    open,
    onOpenChange,
    onArchived
}) {

    const archiveGroup = async () => {

        const response = await fetch(
            `${API_URL}/api/teacher/groups/${group.id}/archive`,
            {
                method: "PUT",
                headers: {
                    Authorization: authHeaders()
                }
            }
        );

        if (response.ok) {

            onOpenChange(false);

            onArchived?.();

        }

    };

    return (

        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <AlertDialogContent>

                <AlertDialogHeader>

                    <AlertDialogTitle>
                        Arkivera grupp
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        Är du säker på att du vill
                        arkivera gruppen{" "}
                        <strong>
                            {group?.name}
                        </strong>
                        ?

                        <br /><br />

                        Gruppen kommer inte längre
                        att visas bland aktiva
                        grupper men kan återställas
                        senare.
                    </AlertDialogDescription>

                </AlertDialogHeader>

                <AlertDialogFooter>

                    <AlertDialogCancel>
                        Avbryt
                    </AlertDialogCancel>

                    <AlertDialogAction
                        className="
                            bg-red-600
                            text-white
                            hover:bg-red-700
                        "
                        onClick={archiveGroup}
                    >
                        Arkivera
                    </AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent>

        </AlertDialog>

    );

}