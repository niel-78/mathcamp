import DraggableTab from "@/components/ui/DraggableTab";
import TabDropZone from "@/components/ui/TabDropZone";

export default function TabBar({
    tabs,
    activeTab,
    setActiveTab,
    activeDragType,
    closeTab,
    area
}) {

    return (

        <>
            {
                activeDragType === "tab" && (
                    <TabDropZone area={area} />
                )
            }

            <div className="flex gap-2 overflow-x-auto whitespace-nowrap">

                {tabs.map(tab => (

                    <DraggableTab
                        key={tab.id}
                        tab={tab}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        closeTab={closeTab}
                        area={area}
                        className="flex-shrink-0"
                    />

                ))}

            </div>

        </>

    );

}