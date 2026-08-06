import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import CreateBlock
    from "@/components/ui/CreateBlock";

export default function CreateBlockDialog({
    open,
    onOpenChange,
    examId,
    centralContentIds = [],
    sectionIds = [],
    onCreated
}) {

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent
                className="max-w-4xl"
            >

                <DialogHeader>

                    <DialogTitle>
                        Skapa eget block
                    </DialogTitle>

                </DialogHeader>

                <CreateBlock
                    examId={examId}
                    centralContentIds={centralContentIds}
                    sectionIds={sectionIds}
                    onCreated={(block) => {

                        onCreated?.(block);

                        onOpenChange(false);

                    }}
                />

            </DialogContent>

        </Dialog>

    );

}