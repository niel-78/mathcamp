import { useDroppable } from "@dnd-kit/core";

export default function DropZone({
    id,
    text,
    className = "",
    onClick
}) {
    const {
        setNodeRef,
        isOver
    } = useDroppable({
        id
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`
                border-2
                border-dashed
                rounded-md
                flex
                items-center
                justify-center
                text-sm
                text-muted-foreground
                ${onClick ? "cursor-pointer hover:bg-accent/50" : ""}
                ${isOver ? "bg-accent" : ""}
                ${className}
            `}
        >
            {text}
        </div>
    );
}