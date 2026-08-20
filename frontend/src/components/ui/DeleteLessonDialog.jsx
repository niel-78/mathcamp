import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

export default function DeleteLessonDialog({
    open,
    onOpenChange,
    lesson,
    onDeleted
}) {

    const deleteLesson = async () => {

        const response = await fetch(
            `${API_URL}/api/lessons/${lesson.id}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        onOpenChange(false);

        onDeleted?.();

    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Radera lektion
                    </DialogTitle>

                </DialogHeader>

                <p>
                    Vill du radera denna lektion?
                </p>

                <div className="flex justify-end">

                    <Button
                        variant="destructive"
                        onClick={deleteLesson}
                    >
                        Radera
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}