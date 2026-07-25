import TabBar from "./Main/TabBar";
import GroupStudentsTab from "./Main/GroupStudentsTab";


import ExamEditor from "./Main/ExamEditor";
import GroupPage from "./Main/GroupPage";

export default function Main({
    tabs,
    activeTab,
    setActiveTab,
    setTabs
}) {

    const currentTab = tabs.find(t => t.id === activeTab);


    return (
        <div className="flex flex-col">

            <TabBar
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setTabs={setTabs}
            />

            <div className="p-4 flex-1 overflow-auto">

                {currentTab?.type === "exam" && (
                    <ExamEditor
                        examId={currentTab.entityId}
                    />
                )}

                {currentTab?.type === "group" && (
                    <GroupPage
                        groupId={
                            currentTab.entityId
                        }
                    />
                )}

                {currentTab?.type === "group-students" && (
                    <GroupStudentsTab
                        groupId={currentTab.groupId}
                    />
                    
                )}

            </div>

        </div>
    );
}