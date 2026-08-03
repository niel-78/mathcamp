import DraggableTab from "@/components/ui/DraggableTab";

export default function TabBar({
    tabs,
    activeTab,
    setActiveTab,
    setTabs,
    area
}) {

    const closeTab = (tabId) => {

        const tabIndex = tabs.findIndex(
            tab => tab.id === tabId
        );

        const newTabs = tabs.filter(
            tab => tab.id !== tabId
        );

        setTabs(newTabs);

        if (activeTab === tabId) {

            if (newTabs.length === 0) {

                setActiveTab(null);

            } else {

                const newIndex =
                    Math.max(0, tabIndex - 1);

                setActiveTab(
                    newTabs[newIndex].id
                );

            }

        }

    };

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