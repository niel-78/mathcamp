import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function CancelLessonDialog({
    lesson,
    open,
    onOpenChange,
    onSaved
}) {

    const restore = !!lesson?.cancelled_at;

    const save = async () => {

        const endpoint =
            lesson.cancelled_at
                ? "restore"
                : "cancel";

        const response =
            await fetch(
                `${API_URL}/api/lessons/${lesson.id}/${endpoint}`,
                {
                    method: "PUT",
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        onOpenChange(false);

        onSaved?.();

    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogTitle>

                    {
                        restore
                            ? "Återaktivera lektion"
                            : "Ställ in lektion"
                    }

                </DialogTitle>

                <p>

                    {
                        restore
                            ? "Vill du återaktivera lektionen?"
                            : "Vill du ställa in lektionen?"
                    }

                </p>

                <Button
                    onClick={save}
                >

                    {
                        restore
                            ? "Återaktivera"
                            : "Ställ in lektion"
                    }

                </Button>

            </DialogContent>

        </Dialog>

    );

}