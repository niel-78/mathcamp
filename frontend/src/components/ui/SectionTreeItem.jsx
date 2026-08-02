import { useDroppable } from "@dnd-kit/core";
import { useEffect } from "react";

export default function SectionTreeItem({
    section,
    hoverTarget,
    openTab
}) {

    const {
        setNodeRef,
    } = useDroppable({
        id: `section-${section.id}`
    });

    const active = hoverTarget === `section-${section.id}`;

    return (
        <div
            ref={setNodeRef}
            className={`
                tree-file
                cursor-pointer
                ${active ? "bg-blue-200" : ""}
            `}
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

            <span className="text-slate-500 ml-2">
                ({section.page_number}
                {section.end_page > section.page_number
                    ? `-${section.end_page}`
                    : ""}
                )
            </span>
        </div>
    );

}