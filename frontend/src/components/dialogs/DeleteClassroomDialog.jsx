import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function DeleteClassroomDialog({
    classroom,
    open,
    onOpenChange,
    onDeleted
}) {

    const deleteClassroom =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/classrooms/${classroom.id}`,
                    {
                        method: "DELETE",
                        headers:
                            authHeaders()
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

                        Radera klassrum

                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <p>

                        Vill du verkligen
                        radera klassrummet
                        <strong>
                            {" "}
                            {classroom?.name}
                        </strong>
                        ?

                    </p>

                    <Button
                        variant="destructive"
                        onClick={
                            deleteClassroom
                        }
                    >
                        Radera
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}