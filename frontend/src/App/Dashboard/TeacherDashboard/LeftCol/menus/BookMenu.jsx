import { Button } from "@/components/ui/button";

export default function BookMenu({
    onImportStructure,
    onDownloadTemplate
}) {

    return (

        <>
            <Button
                variant="inline"
                className="context-menu-button"
                onClick={onImportStructure}
            >
                Importera bokstruktur via Excel
            </Button>
            <Button
                variant="ghost"
                onClick={onDownloadTemplate}
            >
                Ladda ner mall
            </Button>
        </>

    );

}