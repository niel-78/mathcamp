import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function DeleteLayoutDialog({
    layout,
    open,
    onOpenChange,
    onDeleted
}) {

    const deleteLayout = async () => {

        const response = await fetch(
            `${API_URL}/api/classroom-layouts/${layout.id}`,
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
                        Radera möblering
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <p>

                        Vill du verkligen
                        radera möbleringen

                        <strong>
                            {" "}
                            {layout?.name}
                        </strong>

                        ?

                    </p>

                    <Button
                        variant="destructive"
                        onClick={deleteLayout}
                    >
                        Radera
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}