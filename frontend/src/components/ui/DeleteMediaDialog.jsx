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

export default function DeleteMediaDialog({
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
                        Ta bort media?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        Filen kommer att tas bort permanent.
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