import { Button } from "@/components/ui/button";

export default function ClassroomsMenu({
    onCreate
}) {

    return (

        <div className="context-menu">

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onCreate}
            >
                Nytt klassrum
            </Button>

        </div>

    );

}