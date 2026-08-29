import { Button } from "@/components/ui/button";

export default function StudentsMenu({
    onCreateStudent,
    onImportStudents,
    onDownloadStudentTemplate,
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
                onClick={onDownloadStudentTemplate}
                >
                Ladda ner elevmall
            </Button>
            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onPrintLogins}
            >
                Nya elevlösenord
            </Button>

        </div>

    );

}