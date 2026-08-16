import { Button } from "@/components/ui/button";

export default function LevelMenu({
    onCreateBook
}) {

    return (

        <div className="context-menu">

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