import { Button } from "@/components/ui/button";

export default function AbilitySeriesMenu({
    contextMenu,
    user,
    onCreateAbility,
    onImportAbilities,
    onRenameSeries,
    onDeleteSeries
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
                        onClick={onCreateAbility}
                    >
                        Lägg till förmåga
                    </Button>

                    <Button
                        variant="inline"
                        className="context-menu-button"
                        onClick={onImportAbilities}
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
                        onClick={onRenameSeries}
                    >
                        Byt namn
                    </Button>

                    {/* <Button
                        variant="inline"
                        className="context-menu-button"
                    >
                        Dela serie
                    </Button> */}

                    <Button
                        variant="inline"
                        className="context-menu-button"
                        onClick={onDeleteSeries}
                    >
                        Ta bort serie
                    </Button>

                </>

            )}

        </div>

    );

}