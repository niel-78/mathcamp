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

export default function DeleteOptionDialog({
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
                        Ta bort alternativ?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        Alternativet kommer att flyttas till arkivet och kan återställas senare.
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