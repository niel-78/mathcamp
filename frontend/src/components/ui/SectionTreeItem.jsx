import {
    useDraggable
} from "@dnd-kit/core";

import {
    GripVertical
} from "lucide-react";

export default function SectionTreeItem({
    section,
    hoverTarget,
    openTab
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
                className="flex-1"
                onClick={() =>
                    openTab({
                        id: `book-section-${section.id}`,
                        type: "book-section",
                        title: section.title,
                        sectionId: section.id
                    })
                }
            >

                {section.title}

                <span
                    className="
                        text-slate-500
                        ml-2
                    "
                >
                    ({section.page_number}
                    {section.end_page >
                    section.page_number
                        ? `-${section.end_page}`
                        : ""}
                    )
                </span>

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