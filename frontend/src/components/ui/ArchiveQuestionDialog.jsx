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

export default function ArchiveQuestionDialog({
    question,
    open,
    onOpenChange,
    onArchived
}) {

    const archiveQuestion = async () => {

        const response = await fetch(
            `${API_URL}/api/questions/${question.id}/archive`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        if (!response.ok) {

            toast.error(
                "Kunde inte arkivera uppgiften"
            );

            return;

        }

        toast.success(
            "Uppgiften arkiverades"
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
                        Arkivera uppgift
                    </AlertDialogTitle>

                    <AlertDialogDescription>

                        Är du säker på att du vill
                        arkivera uppgiften?

                        <br />
                        <br />

                        Uppgiften flyttas till Arkiv
                        och kan återställas senare.

                    </AlertDialogDescription>

                </AlertDialogHeader>

                <AlertDialogFooter>

                    <AlertDialogCancel>
                        Avbryt
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={archiveQuestion}
                    >
                        Arkivera
                    </AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent>

        </AlertDialog>

    );

}