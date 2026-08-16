import { Button } from "@/components/ui/button";

export default function AbilityMenu({
    onRename,
    onDelete
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
                onClick={onDelete}
            >
                Radera
            </Button>

        </div>

    );

}