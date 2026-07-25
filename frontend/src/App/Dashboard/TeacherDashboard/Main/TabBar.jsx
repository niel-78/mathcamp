export default function TabBar({
    tabs,
    activeTab,
    setActiveTab,
    setTabs
}) {

    const closeTab = (tabId) => {

        setTabs(prev =>
            prev.filter(
                t => t.id !== tabId
            )
        );
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