import { useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { useDraggable } from "@dnd-kit/core";
import {
    GripVertical,
    Trash2,
    MoreVertical,
    Play,
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
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function LessonSection({
    section,
    lessonId,
    openTab,
    readOnly = false
}) {

    const [removing, setRemoving] = useState(false);
    const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

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

        openTab?.({
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

            setConfirmRemoveOpen(false);
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

                    {!readOnly && (
                        <GripVertical
                            size={16}
                            className="
                                cursor-grab
                                text-muted-foreground
                            "
                            {...listeners}
                            {...attributes}
                        />
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        <span>{section.title}</span>
                        {Number(section.page_number) > 0 && (
                            <span className="text-xs text-muted-foreground">
                                (sid {section.page_number}{Number(section.end_page) > Number(section.page_number) ? `-${section.end_page}` : ""})
                            </span>
                        )}
                        {Boolean(section.group_planning_priority ?? section.planning_priority) && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
                                Prioriterad (viktig för E)
                            </span>
                        )}
                    </div>

                </div>

                {!readOnly && (
                    <DropdownMenu>

                        <DropdownMenuTrigger
                            className="
                                inline-flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-md
                                hover:bg-accent
                            "
                        >
                            <MoreVertical size={16} />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>

                            <DropdownMenuItem onClick={openPresentation}>
                                <Play size={14} />
                                {section.presentation_id
                                    ? "Starta presentation"
                                    : "Skapa presentation"}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() =>
                                    togglePin(
                                        section.lesson_section_id,
                                        !section.pinned
                                    )
                                }
                            >
                                {section.pinned
                                    ? <PinOff size={14} />
                                    : <Pin size={14} />
                                }
                                {section.pinned
                                    ? "Ta bort pinning"
                                    : "Pinna sektion"}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setConfirmRemoveOpen(true)}
                            >
                                <Trash2 size={14} />
                                Ta bort sektion
                            </DropdownMenuItem>

                        </DropdownMenuContent>

                    </DropdownMenu>
                )}

            </div>

            <AlertDialog
                open={confirmRemoveOpen}
                onOpenChange={setConfirmRemoveOpen}
            >
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

    );

}