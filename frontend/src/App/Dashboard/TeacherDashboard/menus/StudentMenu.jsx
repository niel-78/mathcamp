import { Button } from "@/components/ui/button";

export default function StudentMenu({
    contextMenu,
    onResetPassword,
    onRename,
    onArchive
}) {

    return (

        <div className="context-menu">

            <div className="px-3 py-2 text-sm text-muted-foreground border-b">
                {contextMenu.firstName} {contextMenu.lastName}
            </div>

            <div className="px-3 py-2 text-sm text-muted-foreground border-b">
                {contextMenu.userName}
            </div>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onResetPassword}
            >
                Nytt lösenord
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onRename}
            >
                Byt namn
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onArchive}
            >
                Ta bort från grupp
            </Button>

        </div>

    );

}