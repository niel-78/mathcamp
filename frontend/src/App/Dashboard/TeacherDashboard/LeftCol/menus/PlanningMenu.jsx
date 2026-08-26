import { Button } from "@/components/ui/button";

export default function PlanningMenu({
    onCreateLessons,
    onManageSchedule,
    onOpenQueue,
    onSharePlanning
}) {

    return (

        <div className="context-menu">

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onCreateLessons}
            >
                Skapa lektioner
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onManageSchedule}
            >
                Hantera schema
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onOpenQueue}
            >
                Planeringskö
            </Button>

            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onSharePlanning}
            >
                Dela planering
            </Button>


        </div>

    );

}