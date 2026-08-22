import { Button } from "@/components/ui/button";

export default function CentralContentLevelMenu({
    onImportCentralContent,
    onDownloadTemplate
}) {

    return (

        <div className="context-menu">

            <Button
                variant="inline"
                className="context-menu-button"
                onClick={onImportCentralContent}
            >
                Importera centralt innehåll via Excel
            </Button>
            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onDownloadTemplate}
            >
                Ladda ner mall
            </Button>

        </div>

    );

}
