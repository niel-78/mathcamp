import { useState } from "react";
import { API_URL } from "@/config";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function DeleteStudentDialog({
    student,
    groupId,
    onDeleted
}) {

    const [open, setOpen] = useState(false);

    const deleteStudent = async () => {

        await fetch(
            `${API_URL}/api/teacher/groups/${groupId}/students/${student.id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization:
                        localStorage.getItem("token")
                }
            }
        );

        setOpen(false);
        onDeleted?.();

    };

    return (
        <div>

            <Button
                size="sm"
                variant="destructive"
                onClick={() => setOpen(true)}
            >
                Ta bort
            </Button>

            <AlertDialog
                open={open}
                onOpenChange={setOpen}
            >
                <AlertDialogContent>

                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Ta bort elev?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            Vill du verkligen ta bort
                            {" "}
                            {student.first_name}
                            {" "}
                            {student.last_name}
                            ?
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>

                        <AlertDialogCancel>
                            Avbryt
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={deleteStudent}
                        >
                            Ta bort
                        </AlertDialogAction>

                    </AlertDialogFooter>

                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}