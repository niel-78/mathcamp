import { useDroppable } from "@dnd-kit/core";

export default function ExamBlock({
    block,
    children,
    activeDragType
}) {

    const enabled =
        activeDragType === "assessment-block";

    const { setNodeRef } =
        useDroppable({
            id: `assessment-block-${block.id}`,
            disabled: !enabled
        });

    return (
        <div ref={enabled ? setNodeRef : undefined}>
            {children}
        </div>
    );

}