import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";

export default function DraggableTab({
    tab,
    activeTab,
    setActiveTab,
    closeTab,
    area
}) {

    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        transform
    } = useDraggable({
        id: `tab-${tab.id}`,
        data: {
            type: "tab",
            tab,
            sourceArea: area
        }
    });

    const {
        setNodeRef: setDropRef
    } = useDroppable({
        id: `tab-${tab.id}`
    });

    const setRefs = (node) => {

        setDragRef(node);
        setDropRef(node);

    };

    const isActive =
        activeTab === tab.id;

    const style = transform
        ? {
            transform: `
                translate3d(
                    ${transform.x}px,
                    ${transform.y}px,
                    0
                )
            `
        }
        : undefined;

    return (

        <div
            ref={setRefs}
            style={style}
            onClick={() =>
                setActiveTab(tab.id)
            }
            className={`
                flex
                items-center
                gap-2

                px-3
                py-2

                border-r
                border-border

                cursor-pointer
                select-none

                min-w-[150px]
                max-w-[250px]

                transition-colors

                ${
                    isActive

                        ? `
                            bg-card
                            text-card-foreground

                            border-t-2
                            border-t-primary

                            font-medium
                          `

                        : `
                            bg-muted
                            text-muted-foreground

                            hover:bg-accent
                            hover:text-accent-foreground
                          `
                }
            `}
        >

            <span
                {...listeners}
                {...attributes}
                onClick={(e) =>
                    e.stopPropagation()
                }
                className="
                    cursor-grab
                    text-muted-foreground
                    shrink-0
                "
            >
                ⠿
            </span>

            <div
                className="
                    flex-1
                    overflow-hidden
                "
            >

                <div
                    className="
                        text-xs
                        text-muted-foreground
                        truncate
                    "
                >
                    {tab.subtitle}
                </div>

                <div
                    className="
                        text-sm
                        truncate
                    "
                >
                    {tab.title}
                </div>

            </div>

            <Button
                type="button"
                variant="ghost"
                onClick={(e) => {

                    e.stopPropagation();

                    closeTab(tab.id);

                }}
                className="
                    shrink-0

                    text-muted-foreground

                    hover:text-destructive

                    px-1

                    transition-colors
                "
            >
                ×
            </Button>

        </div>

    );

}