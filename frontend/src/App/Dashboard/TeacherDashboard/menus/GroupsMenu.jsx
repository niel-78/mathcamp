import { Button } from "@/components/ui/button";

export default function GroupsMenu({
    onCreateGroup
}) {

    return (

        <div className="context-menu">

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onCreateGroup}
            >
                Ny grupp
            </Button>

        </div>

    );

}