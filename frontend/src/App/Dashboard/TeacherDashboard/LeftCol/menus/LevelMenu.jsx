import { Button } from "@/components/ui/button";

export default function LevelMenu({
    onCreateBook,
    onRename
}) {

    return (

        <div className="context-menu">

            <Button
                variant="inline"
                className="context-menu-button"
                onClick={onRename}
            >
                Byt namn
            </Button>

            <Button
                variant="inline"
                className="context-menu-button"
                onClick={onCreateBook}
            >
                Lägg till bok
            </Button>

        </div>

    );

}