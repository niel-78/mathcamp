import { useDraggable } from "@dnd-kit/core";
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
        setNodeRef,
        transform,
    } = useDraggable({
        id: `tab-${tab.id}`,
        data: {
            tab,
            sourceArea: area
        }
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
        }
        : undefined;

    return (

        <Button
            ref={setNodeRef}
            style={style}
            variant="outline"
            onClick={() =>
                setActiveTab(tab.id)
            }
        >

            <span
                {...listeners}
                {...attributes}
                className="cursor-grab mr-2"
            >
                ⠿
            </span>

            {tab.title}

            <span
                onClick={(e) => {

                    e.stopPropagation();

                    closeTab(tab.id);

                }}
            >
                ×
            </span>

        </Button>

    );
}