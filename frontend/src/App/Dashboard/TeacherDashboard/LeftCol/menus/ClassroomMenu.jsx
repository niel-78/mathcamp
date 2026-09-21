import { Button } from "@/components/ui/button";

export default function ClassroomMenu({
    onCreateLayout,
    onRename,
    onDelete,
    canManage
}) {

    return (

        <div className="context-menu">

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onCreateLayout}
            >
                Ny möblering!
            </Button>

            {canManage && (
                <>
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
                        onClick={onDelete}
                    >
                        Radera
                    </Button>
                </>
            )}

        </div>

    );

}
