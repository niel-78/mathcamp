import { useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Trash2 } from "lucide-react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Pin,
    PinOff
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function LessonSection({
    section,
    lessonId,
    openTab,
    readOnly = false
}) {

    const [removing, setRemoving] = useState(false);

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

    const openPresentation = async () => {

        const response =
            await fetch(
                `${API_URL}/api/books/sections/${section.id}/open-presentation`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        openTab({
            id:
                `presentation-player-${data.presentation.id}`,
            title:
                `${data.presentation.title} (Visa)`,
            type:
                "presentation-player",
            presentationId:
                data.presentation.id
        });

    };

    const removeFromLesson = async () => {
        setRemoving(true);

        try {
            const response = await fetch(
                `${API_URL}/api/lessons/lesson-sections/${section.lesson_section_id}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            if (!response.ok) {
                return;
            }

            window.dispatchEvent(
                new Event("lesson-section-added")
            );
        } finally {
            setRemoving(false);
        }
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

                <div className="flex items-center gap-2">

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={openPresentation}
                    >
                        <Play size={14} />

                        <span className="ml-1">
                            {
                                section.presentation_id
                                    ? "Starta"
                                    : "Skapa"
                            }
                        </span>
                    </Button>

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
                        {section.pinned
                            ? <Pin size={14} />
                            : <PinOff size={14} />
                        }
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger
                            render={
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={readOnly}
                                    title="Ta bort sektion från lektionen"
                                />
                            }
                        >
                            <Trash2 size={14} />
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Ta bort sektion från lektionen?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Sektionen tas bort från den här lektionen,
                                    men finns kvar i boken.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    Avbryt
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    variant="destructive"
                                    onClick={removeFromLesson}
                                    disabled={removing}
                                >
                                    {removing
                                        ? "Tar bort..."
                                        : "Ta bort"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </div>

            </div>


        </div>

    );

}