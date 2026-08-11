import { useDroppable } from "@dnd-kit/core";

export default function TabDropZone({
    area
}) {

    const {
        setNodeRef,
        isOver
    } = useDroppable({
        id: `tab-panel-${area}`
    });

    return (

        <div
            ref={setNodeRef}
            className={`
                h-3
                transition-all

                ${
                    isOver
                        ? "bg-blue-500"
                        : "bg-transparent"
                }
            `}
        />

    );

}