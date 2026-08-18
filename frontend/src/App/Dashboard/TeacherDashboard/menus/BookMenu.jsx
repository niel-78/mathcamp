import { Button } from "@/components/ui/button";

export default function BookMenu({
    onImportStructure
}) {

    return (

        <div className="context-menu">

            <Button
                variant="inline"
                className="context-menu-button"
                onClick={onImportStructure}
            >
                Importera bokstruktur via Excel
            </Button>

        </div>

    );

}