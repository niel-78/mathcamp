import { useDroppable } from "@dnd-kit/core";
import DraggableTab from "@/components/ui/DraggableTab";

export default function TabBar({
    tabs,
    activeTab,
    setActiveTab,
    closeTab,
    area,
    activeDragType
}) {

    const enabled = activeDragType === "tab";

    const {
        setNodeRef,
        isOver
    } = useDroppable({
        id: `tab-panel-${area}`,
        disabled: !enabled
    });

    return (

        <div
            ref={setNodeRef}
            className={`
                flex
                gap-2
                overflow-x-auto
                whitespace-nowrap

                ${tabs.length === 0
                    ? "min-h-10 items-center"
                    : ""
                }

                ${
                    isOver
                        ? "bg-blue-500/10"
                        : ""
                }
            `}
        >

            {tabs.length === 0 && (
                <span className="text-sm text-muted-foreground px-2">
                    Dra en flik hit
                </span>
            )}

            {tabs.map(tab => (
                <DraggableTab
                    key={tab.id}
                    tab={tab}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    closeTab={closeTab}
                    area={area}
                    activeDragType={activeDragType}
                />
            ))}

        </div>

    );

}