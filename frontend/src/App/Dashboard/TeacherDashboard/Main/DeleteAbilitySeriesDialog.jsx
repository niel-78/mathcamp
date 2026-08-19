import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function DeleteAbilitySeriesDialog({
    open,
    onOpenChange,
    series,
    onDeleted
}) {

    const remove = async () => {

        const response = await fetch(
            `${API_URL}/api/ability-series/${series.id}`,
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
                        Ta bort serie
                    </DialogTitle>

                </DialogHeader>

                <p>
                    Vill du ta bort serien
                    <strong>
                        {" "}
                        {series?.name}
                    </strong>
                    ?
                </p>

                <div className="flex gap-2">

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