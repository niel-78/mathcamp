import { Button } from "@/components/ui/button";

export default function ClassroomLayoutMenu({
    onRename,
    onDelete,
    onDuplicate
}) {

    return (

        <div className="context-menu">

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
                onClick={onDuplicate}
            >
                Duplicera
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onDelete}
            >
                Radera
            </Button>

        </div>

    );

}