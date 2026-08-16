import { Button } from "@/components/ui/button";

export default function SubjectMenu({
    onCreateLevel
}) {

    return (

        <div className="context-menu">

            <Button
                variant="inline"
                className="context-menu-button"
                onClick={onCreateLevel}
            >
                Lägg till kurs
            </Button>

        </div>

    );

}