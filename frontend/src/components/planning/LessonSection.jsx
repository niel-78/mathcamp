import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Pin,
    PinOff
} from "lucide-react";

export default function LessonSection({
    section,
    lessonId,
    readOnly = false
}) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform
    } = useDraggable({
        id: `lesson-section-${lessonId}-${section.id}`,
        disabled: readOnly,
        data: {
            type: "lesson-section",
            sectionId: section.id,
            lessonId
        }
    });

    const togglePin = async (
        lessonSectionId,
        pinned
    ) => {

        const response =
            await fetch(
                `${API_URL}/api/lessons/lesson-sections/${lessonSectionId}/pin`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        pinned
                    })
                }
            );

        if (!response.ok) {
            return;
        }

        window.dispatchEvent(
            new Event(
                "lesson-section-added"
            )
        );

    };

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
            {/* <div
                className="
                    flex
                    items-center
                    justify-between
                    gap-2
                "
            >

                <div>
                    {section.title}
                </div>

                <Button
                    size="icon"
                    variant={
                        section.pinned
                            ? "default"
                            : "ghost"
                    }
                    onClick={() =>
                        togglePin(
                            section.lesson_section_id,
                            !section.pinned
                        )
                    }
                >

                    {
                        section.pinned
                            ? <Pin size={14} />
                            : <PinOff size={14} />
                    }

                </Button>

            </div> */}

            <div
                className="
                    flex
                    items-center
                    justify-between
                    gap-2
                "
            >

                <div
                    className="
                        flex
                        items-center
                        gap-2
                    "
                >

                    <GripVertical
                        size={16}
                        className="
                            cursor-grab
                            text-muted-foreground
                        "
                        {...listeners}
                        {...attributes}
                    />

                    <div>
                        {section.title}
                    </div>

                </div>

                <Button
                    size="icon"
                    variant={
                        section.pinned
                            ? "default"
                            : "ghost"
                    }
                    onClick={() =>
                        togglePin(
                            section.lesson_section_id,
                            !section.pinned
                        )
                    }
                >
                    {
                        section.pinned
                            ? <Pin size={14} />
                            : <PinOff size={14} />
                    }
                </Button>

            </div>


        </div>

    );

}