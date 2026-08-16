import { Button } from "@/components/ui/button";

export default function CriteriaLevelMenu({
    onImportCriteria
}) {

    return (

        <div className="context-menu">

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onImportCriteria}
            >
                Importera betygskriterier via Excel
            </Button>

        </div>

    );

}