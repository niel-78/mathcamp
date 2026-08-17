import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button }
    from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

export default function DeleteExamDialog({
    open,
    onOpenChange,
    assessment,
    onDeleted
}) {

    const deleteExam = async () => {

        const res = await fetch(
            `${API_URL}/api/archive/assessments/${assessment.id}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        if (res.ok) {

            onOpenChange(false);

            onDeleted?.();

            window.dispatchEvent(
                new Event("assessments-changed")
            );

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
                        Radera prov
                    </DialogTitle>

                </DialogHeader>

                <p>

                    Vill du radera provet

                    <strong>
                        {" "}
                        {assessment?.title}
                        {" "}
                    </strong>

                    ?

                </p>

                <div
                    className="
                        flex
                        justify-end
                    "
                >

                    <Button
                        variant="destructive"
                        onClick={deleteExam}
                    >
                        Radera
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}