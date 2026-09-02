import { Button } from "@/components/ui/button";

export default function GroupMenu({
    onRename,
    onSetAbilitySeries,
    onArchive
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
                onClick={onSetAbilitySeries}
            >
                Ändra förmågaserie
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onArchive}
            >
                Arkivera
            </Button>

        </div>
    );
}