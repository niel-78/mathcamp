import { useDroppable } from "@dnd-kit/core";

export default function ExamBlock({
    block,
    children,
    activeDragType
}) {

    const enabled =
        activeDragType === "exam-block";

    const { setNodeRef } =
        useDroppable({
            id: `exam-block-${block.id}`,
            disabled: !enabled
        });

    return (
        <div ref={enabled ? setNodeRef : undefined}>
            {children}
        </div>
    );

}