import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";

export default function LessonSection({
    section,
    lessonId
}) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform
    } = useDraggable({
        id: `lesson-section-${lessonId}-${section.id}`,
        data: {
            type: "lesson-section",
            sectionId: section.id,
            lessonId
        }
    });

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined
    };

    return (

        <div
            ref={setNodeRef}
            style={style}
            className="
                rounded-md
                border
                p-2
                bg-card
            "
        >

            <div
                className="
                    flex
                    justify-between
                    items-center
                    gap-2
                "
            >

                <div className="flex-1">

                    <div>
                        {section.title}
                    </div>

                    <div
                        className="
                            text-xs
                            text-muted-foreground
                        "
                    >

                        s.{section.page_number}

                        {section.end_page >
                        section.page_number
                            ? `-${section.end_page}`
                            : ""}

                    </div>

                </div>

                <button
                    type="button"
                    {...listeners}
                    {...attributes}
                    className="
                        text-muted-foreground
                        hover:text-foreground
                        cursor-grab
                        active:cursor-grabbing
                    "
                >

                    <GripVertical size={18} />

                </button>

            </div>

        </div>

    );

}