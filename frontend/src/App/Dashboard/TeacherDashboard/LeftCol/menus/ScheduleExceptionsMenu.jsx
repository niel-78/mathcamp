import { Button } from "@/components/ui/button";

export default function ScheduleExceptionsMenu({
    onCreate,
    onImport,
    onDownloadTemplate
}) {

    return (
        <>
            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onCreate}
            >
                Lägg till schemabrytande dag
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onImport}
            >
                Importera från Excel
            </Button>

            <button
                className="context-menu-button"
                variant="inline"
                onClick={onDownloadTemplate}
            >
                Ladda ner mall
            </button>
        </>
    );
}