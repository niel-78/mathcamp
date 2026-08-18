import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";


export default function ShuffleSeatsDialog({
    open,
    onOpenChange,
    groupId,
    onCompleted
}) {

    const shuffle =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/groups/${groupId}/seat-assignments/shuffle`,
                    {
                        method: "POST",
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            onCompleted?.();

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
                        Slumpa sittplatser
                    </DialogTitle>

                </DialogHeader>

                <p>
                    Alla opinnade elever
                    får nya platser.
                </p>

                <Button
                    onClick={shuffle}
                >
                    Slumpa
                </Button>

            </DialogContent>

        </Dialog>

    );

}
