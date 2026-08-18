import { Button } from "@/components/ui/button";

export default function GroupMenu({
    contextMenu,
    setContextMenu,
    setRenameDialog,
    setArchiveDialog
}) {

    return (

        <div className="context-menu">

            <div className="px-3 py-2 text-sm text-muted-foreground border-b">
                {contextMenu.groupName}
            </div>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={() => {

                    setRenameDialog({
                        id: contextMenu.groupId,
                        name: contextMenu.groupName
                    });

                    setContextMenu(null);

                }}
            >
                Byt namn
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={() => {

                    setArchiveDialog({
                        id: contextMenu.groupId,
                        name: contextMenu.groupName
                    });

                    setContextMenu(null);

                }}
            >
                Arkivera
            </Button>

        </div>

    );

}