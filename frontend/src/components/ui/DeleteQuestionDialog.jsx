import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";

export default function DeleteQuestionDialog({
    open,
    onOpenChange,
    onDelete
}) {

    return (

        <AlertDialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <AlertDialogContent>

                <AlertDialogHeader>

                    <AlertDialogTitle>
                        Ta bort fråga?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        Frågan kommer att flyttas till arkivet och kan återställas senare.
                    </AlertDialogDescription>

                </AlertDialogHeader>

                <AlertDialogFooter>

                    <AlertDialogCancel>
                        Avbryt
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={onDelete}
                    >
                        Ta bort
                    </AlertDialogAction>

                </AlertDialogFooter>

            </AlertDialogContent>

        </AlertDialog>

    );

}