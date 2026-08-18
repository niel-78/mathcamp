import { Button } from "@/components/ui/button";

export default function StudentsMenu({
    onCreateStudent,
    onImportStudents
}) {

    return (

        <div className="context-menu">

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onCreateStudent}
            >
                Lägg till elev
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onImportStudents}
            >
                Importera elever
            </Button>

        </div>

    );

}