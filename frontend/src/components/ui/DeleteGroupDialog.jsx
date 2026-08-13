import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

export default function DeleteGroupDialog({
    open,
    onOpenChange,
    group,
    onDeleted
}) {

    const deleteGroup = async () => {

        const res = await fetch(
            `${API_URL}/api/archive/groups/${group.id}`,
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
                        Radera grupp
                    </DialogTitle>

                </DialogHeader>

                <p>

                    Vill du radera gruppen

                    <strong>
                        {" "}
                        {group?.name}
                        {" "}
                    </strong>

                    ?

                </p>

                <div className="flex justify-end">

                    <Button
                        variant="destructive"
                        onClick={deleteGroup}
                    >
                        Radera
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}