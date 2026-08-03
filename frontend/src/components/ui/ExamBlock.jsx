import { useDroppable } from "@dnd-kit/core";

export default function ExamBlock({
    block,
    children
}) {

    const { setNodeRef } =
        useDroppable({
            id: `exam-block-${block.id}`
        });

    return (
        <div ref={setNodeRef}>
            {children}
        </div>
    );
}