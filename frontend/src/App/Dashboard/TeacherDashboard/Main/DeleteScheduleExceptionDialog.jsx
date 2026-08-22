import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function DeleteScheduleExceptionDialog({
    open,
    onOpenChange,
    exception,
    onDeleted
}) {

    const remove = async () => {

        const response =
            await fetch(
                `${API_URL}/api/group-schedules/exceptions/${exception.exceptionId}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        onDeleted?.();

        onOpenChange(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent>

                <DialogHeader>
                    <DialogTitle>
                        Ta bort schemabrytande dag
                    </DialogTitle>
                </DialogHeader>

                <div className="flex justify-end gap-2">

                    <Button
                        variant="outline"
                        onClick={() =>
                            onOpenChange(false)
                        }
                    >
                        Avbryt
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={remove}
                    >
                        Ta bort
                    </Button>

                </div>

            </DialogContent>
        </Dialog>
    );
}