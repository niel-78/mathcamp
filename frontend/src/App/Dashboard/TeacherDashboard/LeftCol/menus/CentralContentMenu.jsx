import { Button } from "@/components/ui/button";

export default function CentralContentLevelMenu({
    onImportCentralContent
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

        </div>

    );

}
