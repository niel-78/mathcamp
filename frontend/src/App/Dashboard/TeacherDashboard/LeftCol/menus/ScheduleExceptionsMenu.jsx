export default function ScheduleExceptionsMenu({
    onCreate,
    onImport,
    onDownloadTemplate
}) {

    return (
        <>
            <button
                className="context-menu-button"
                variant="inline"
                onClick={onCreate}
            >
                Lägg till schemabrytande dag
            </button>

            <button
                className="context-menu-button"
                variant="inline"
                onClick={onImport}
            >
                Importera från Excel
            </button>

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