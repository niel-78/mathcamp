import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function StartExamErrorDialog({
    open,
    onOpenChange,
    message
}) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <AlertDialogContent>

                <AlertDialogHeader>

                    <AlertDialogTitle>
                        Kunde inte starta provet
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        {message}
                    </AlertDialogDescription>

                </AlertDialogHeader>

                <AlertDialogFooter>

                    <AlertDialogAction
                        onClick={() => onOpenChange(false)}
                    >
                        OK
                    </AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent>
        </AlertDialog>
    );
}
