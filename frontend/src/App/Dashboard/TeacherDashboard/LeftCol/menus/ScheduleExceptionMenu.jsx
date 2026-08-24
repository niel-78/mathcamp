import { Button } from "@/components/ui/button";

export default function ScheduleExceptionMenu({
    onDelete,
    onEdit
}) {
    return (
        <>
            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onDelete}
            >
                Ta bort
            </Button>
            <Button
                className="context-menu-button"
                variant="inline"
                onClick={onEdit}
            >
                Redigera
            </Button>
                    
        </>
    );
}