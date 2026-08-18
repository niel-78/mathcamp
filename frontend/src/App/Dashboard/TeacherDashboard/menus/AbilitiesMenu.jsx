import { Button } from "@/components/ui/button";

export default function AbilitiesMenu({
    onCreateSeries
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

        </div>

    );

}