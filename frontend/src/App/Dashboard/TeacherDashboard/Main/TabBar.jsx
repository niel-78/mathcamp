import DraggableTab from "@/components/ui/DraggableTab";

export default function TabBar({
    tabs,
    activeTab,
    setActiveTab,
    closeTab,
    area
}) {

    return (
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
    );
}