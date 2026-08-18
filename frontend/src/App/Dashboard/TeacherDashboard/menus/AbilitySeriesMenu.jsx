import { Button } from "@/components/ui/button";

export default function AbilitySeriesMenu({
    contextMenu,
    user,
    setContextMenu,
    setCreateAbilityDialog,
    setImportAbilitiesDialog,
    setRenameAbilitySeriesDialog
}) {

    const canEdit =
        user?.role === "super" ||
        contextMenu.permission === "owner" ||
        contextMenu.permission === "editor";

    const canManage =
        user?.role === "super" ||
        contextMenu.permission === "owner";

    return (

        <div className="context-menu">

            {canEdit && (

                <>
                    <Button
                        variant="inline"
                        className="context-menu-button"
                        onClick={() => {

                            setCreateAbilityDialog({
                                id: contextMenu.seriesId,
                                name: contextMenu.seriesName
                            });

                            setContextMenu(null);

                        }}
                    >
                        Lägg till förmåga
                    </Button>

                    <Button
                        variant="inline"
                        className="context-menu-button"
                        onClick={() => {

                            setImportAbilitiesDialog({
                                seriesId: contextMenu.seriesId,
                                seriesName: contextMenu.seriesName
                            });

                            setContextMenu(null);

                        }}
                    >
                        Importera förmågor via Excel
                    </Button>
                </>

            )}

            {canManage && (

                <>
                    <Button
                        variant="inline"
                        className="context-menu-button"
                        onClick={() => {

                            setRenameAbilitySeriesDialog({
                                id: contextMenu.seriesId,
                                name: contextMenu.seriesName
                            });

                            setContextMenu(null);

                        }}
                    >
                        Byt namn
                    </Button>

                    <Button
                        variant="inline"
                        className="context-menu-button"
                    >
                        Dela serie
                    </Button>

                    <Button
                        variant="inline"
                        className="context-menu-button"
                    >
                        Ta bort serie
                    </Button>
                </>

            )}

        </div>

    );

}