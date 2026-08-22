import { Button } from "@/components/ui/button";

export default function AbilitiesMenu({
    onCreateSeries,
    onDownloadTemplate
}) {

    return (

        <div className="context-menu">

            <Button
                variant="inline"
                className="context-menu-button"
                onClick={onCreateSeries}
            >
                Ny serie
            </Button>

            <Button
                variant="inline"
                className="context-menu-button"
                onClick={onDownloadTemplate}
            >
                Ladda ner mall
            </Button>

        </div>

    );

}