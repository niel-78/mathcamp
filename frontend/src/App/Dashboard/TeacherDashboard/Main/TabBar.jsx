export default function TabBar({
    tabs,
    activeTab,
    setActiveTab,
    setTabs
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
        <div className="flex border-b">

            {tabs.map(tab => (

                <button
                    key={tab.id}
                    onClick={() =>
                        setActiveTab(tab.id)
                    }
                    className={`
                        px-4 py-2 border-r
                        ${
                            activeTab === tab.id
                                ? "bg-white"
                                : "bg-gray-100"
                        }
                    `}
                >
                    {tab.title}

                    {" "}

                    <span
                        onClick={(e) => {

                            e.stopPropagation();

                            closeTab(tab.id);

                        }}
                    >
                        ×
                    </span>

                </button>

            ))}

        </div>
    );
}