import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

export default function DeleteAbilityDialog({
    open,
    onOpenChange,
    ability,
    onDeleted
}) {

    const deleteAbility = async () => {

        const res = await fetch(
            `${API_URL}/api/abilities/${ability.id}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        if (res.ok) {

            onOpenChange(false);

            onDeleted?.();

        }

    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Radera förmåga
                    </DialogTitle>

                </DialogHeader>

                <p>
                    Vill du radera förmågan
                    <strong>
                        {" "}
                        {ability?.name}
                        {" "}
                    </strong>
                    ?
                </p>

                <Button
                    variant="destructive"
                    onClick={
                        deleteAbility
                    }
                >
                    Radera
                </Button>

            </DialogContent>

        </Dialog>

    );

}