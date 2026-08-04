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

export default function DeleteExamDialog({
    exam,
    open,
    onOpenChange,
    onDeleted
}) {

    const deleteExam = async () => {

        const response = await fetch(
            `${API_URL}/api/exams/${exam.id}`,
            {
                method: "DELETE",
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

        onOpenChange(false);

        onDeleted?.();

    };

    return (

        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <AlertDialogContent>

                <AlertDialogHeader>

                    <AlertDialogTitle>
                        Ta bort prov
                    </AlertDialogTitle>

                    <AlertDialogDescription>

                        Är du säker på att du vill
                        ta bort provet

                        {" "}

                        <strong>
                            {exam?.title}
                        </strong>

                        ?

                        <br />
                        <br />

                        Provet tas bort från dina
                        aktiva prov men inga resultat
                        raderas.

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
                        onClick={deleteExam}
                    >
                        Ta bort
                    </AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent>

        </AlertDialog>

    );

}
