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

export default function ArchiveStudentDialog({
    student,
    open,
    onOpenChange,
    onArchived
}) {

    const archiveStudent = async () => {
        
        const response = await fetch(
            `${API_URL}/api/groups/${student.groupId}/students/${student.userId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        if (!response.ok) {

            toast.error(
                "Kunde inte arkivera eleven"
            );
            console.log(response.status);

            return;
        }

        toast.success(
            "Eleven arkiverades"
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
                        Arkivera elev
                    </AlertDialogTitle>

                    <AlertDialogDescription>

                        Är du säker på att du vill
                        arkivera eleven

                        {" "}

                        <strong>
                            {student?.name}
                        </strong>

                        ?

                        <br />
                        <br />

                        Eleven tas bort från gruppen
                        men inga resultat raderas.

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
                        onClick={archiveStudent}
                    >
                        Arkivera
                    </AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent>

        </AlertDialog>

    );

}