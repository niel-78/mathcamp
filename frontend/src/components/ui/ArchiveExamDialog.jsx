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

export default function ArchiveExamDialog({
    exam,
    open,
    onOpenChange,
    onArchived
}) {

    const archiveExam = async () => {

        const response = await fetch(
            `${API_URL}/api/exams/${exam.id}/archive`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        if (!response.ok) {

            toast.error(
                "Kunde inte arkivera provet"
            );

            return;

        }

        toast.success(
            "Provet arkiverades"
        );

        window.dispatchEvent(
            new Event("exams-changed")
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
                        Arkivera prov
                    </AlertDialogTitle>

                    <AlertDialogDescription>

                        Är du säker på att du vill
                        arkivera provet

                        {" "}

                        <strong>
                            {exam?.title}
                        </strong>

                        ?

                        <br />
                        <br />

                        Provet flyttas till Arkiv
                        och kan återställas senare.

                    </AlertDialogDescription>

                </AlertDialogHeader>

                <AlertDialogFooter>

                    <AlertDialogCancel>
                        Avbryt
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={archiveExam}
                    >
                        Arkivera
                    </AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent>

        </AlertDialog>

    );

}