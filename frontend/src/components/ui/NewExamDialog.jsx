import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

export default function NewExamDialog({
    open,
    onOpenChange,
    children
}) {

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Skapa nytt prov
                    </DialogTitle>

                </DialogHeader>

                {children}

            </DialogContent>

        </Dialog>

    );

}