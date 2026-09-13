import {
    useDraggable
} from "@dnd-kit/core";

import {
    GripVertical
} from "lucide-react";

export default function SectionTreeItem({
    section,
    hoverTarget,
    openTab,
    inPlanningQueue = true,
    groupId,
    groupName,
    groupAbilitySeriesId
}) {

    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform
    } = useDraggable({
        id: `section-${section.id}`,
        data: {
            type: "section",
            sectionId: section.id,
            section
        }
    });

    const style =
        transform
            ? {
                transform: `translate3d(
                    ${transform.x}px,
                    ${transform.y}px,
                    0
                )`
            }
            : undefined;

    const active =
        hoverTarget ===
        `section-${section.id}`;

    const dimmed = !inPlanningQueue;

    return (

        <div
            ref={setNodeRef}
            style={style}
            className={`
                tree-file
                flex
                items-center
                justify-between

                ${
                    active
                        ? "bg-blue-200"
                        : ""
                }
            `}
        >

            <div
                className={`
                    flex-1
                    ${
                        dimmed
                            ? "text-slate-400"
                            : ""
                    }
                `}
                onClick={() =>
                    openTab({
                        id: `book-section-${section.id}`,
                        type: "book-section",
                        title: section.title,
                        sectionId: section.id,
                        groupId,
                        groupName,
                        groupAbilitySeriesId
                    })
                }
            >

                {section.title}

                <span
                    className={`
                        ml-2
                        ${
                            dimmed
                                ? "text-slate-400"
                                : "text-slate-500"
                        }
                    `}
                >
                    ({section.page_number}
                    -
                    {section.end_page ?? section.page_number})
                </span>

                {section.block_count > 0 && (
                    <span
                        className={`
                            ml-2
                            text-xs
                            rounded-full
                            px-1.5
                            py-0.5
                            ${
                                dimmed
                                    ? "bg-slate-100 text-slate-400"
                                    : "bg-slate-200 text-slate-600"
                            }
                        `}
                        title="Antal kopplade block"
                    >
                        {section.block_count}
                    </span>
                )}

            </div>

            <div
                ref={setActivatorNodeRef}
                {...listeners}
                {...attributes}
                className="
                    ml-2
                    p-1
                    cursor-grab
                    text-muted-foreground
                    hover:text-foreground
                    rounded
                "
                title="Dra till lektion"
            >
                <GripVertical size={16} />
            </div>

        </div>

    );

}