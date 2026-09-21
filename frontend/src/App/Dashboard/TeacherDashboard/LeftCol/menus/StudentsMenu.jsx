import { Button } from "@/components/ui/button";

export default function StudentsMenu({
    onCreateStudent,
    onImportStudents,
    onImportExistingStudent,
    onPrintLogins
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

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onImportExistingStudent}
            >
                Importera befintlig elev
            </Button>

            {onPrintLogins && (
                <Button
                    className="context-menu-button"
                    variant="inline"
                    onClick={onPrintLogins}
                >
                    Nya elevlösenord
                </Button>
            )}

        </div>

    );

}