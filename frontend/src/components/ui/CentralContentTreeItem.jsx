import { useDroppable } from "@dnd-kit/core";

export default function CentralContentTreeItem({
    item,
    level,
    hoverTarget,
    openTab
}) {

    const {
        setNodeRef
    } = useDroppable({
        id: `cc-${item.id}`
    });

    const active =
        hoverTarget === `cc-${item.id}`;    

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
                    id: `cc-${item.id}`,
                    type: "central-content",
                    title: level.code,
                    centralContentId: item.id,
                    centralContentTitle: item.content,
                    levelCode: level.code
                })
            }
        >
            {item.content}
        </div>

    );

}