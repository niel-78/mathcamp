import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button }
    from "@/components/ui/button";

import { API_URL }
    from "@/config";

import { authHeaders }
    from "@/api/authHeaders";

export default function DeleteSeatDialog({
    seat,
    open,
    onOpenChange,
    onDeleted
}) {

    const deleteSeat =
        async () => {

            await fetch(
                `${API_URL}/api/classroom-seats/${seat.id}`,
                {
                    method: "DELETE",
                    headers:
                        authHeaders()
                }
            );

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
                        Radera plats
                    </DialogTitle>

                </DialogHeader>

                <p>
                    Vill du radera
                    {` ${seat?.seat_label}`}?
                </p>

                <Button
                    variant="destructive"
                    onClick={deleteSeat}
                >
                    Radera
                </Button>

            </DialogContent>

        </Dialog>

    );

}