import { useDroppable } from "@dnd-kit/core";

export default function DropZone({
    id,
    text,
    className = ""
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
            className={`
                border-2
                border-dashed
                rounded-md
                flex
                items-center
                justify-center
                text-sm
                text-muted-foreground
                ${isOver ? "bg-accent" : ""}
                ${className}
            `}
        >
            {text}
        </div>
    );
}