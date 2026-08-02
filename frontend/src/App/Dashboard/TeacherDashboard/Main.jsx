import TabBar from "./Main/TabBar";
import StartPage from "./Main/StartPage";
import ExamList from "./Main/ExamList";
import BlockBankTab from "./Main/BlockBankTab";
import BlockEditor from "@/components/ui/BlockEditor";
import GroupStudentsTab from "./Main/GroupStudentsTab";
import CentralContentTab from "./Main/CentralContentTab";
import StudentTab from "./Main/StudentTab";
import SectionTab from "./Main/SectionTab";

export default function Main({
    tabs,
    activeTab,
    setActiveTab,
    setTabs,
    blockRefreshKey,
    openTab
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

                {currentTab?.type === "home" && (
                    <StartPage
                        openTab={openTab}
                    />
                )}

                {currentTab?.type === "exams" && (
                    <ExamList
                        openTab={openTab}
                    />
                )}

                {currentTab?.type === "blocks" && (
                    <BlockBankTab
                        openTab={openTab}
                    />
                )}

                {currentTab?.type === "groups" && (
                    <GroupsTab />
                )}

                {currentTab?.type === "group-students" && (
                    <GroupStudentsTab
                        groupId={currentTab.groupId}
                    />
                    
                )}

                {
                currentTab?.type === "student" && (

                    <StudentTab
                        studentId={currentTab.studentId}
                        groupId={currentTab.groupId}
                    />

                )}

                {currentTab?.type === "central-content" && (
                    <CentralContentTab
                        centralContentId={
                            currentTab.centralContentId
                        }
                        centralContentTitle={
                            currentTab.centralContentTitle
                        }
                        levelCode={
                            currentTab.levelCode
                        }
                        openTab={openTab}
                        blockRefreshKey={blockRefreshKey}
                    />
                )}

                {    currentTab?.type === "block" && (

                    <BlockEditor
                        block={currentTab.block}
                    />

                )}

                {    currentTab?.type === "book-section" && (

                    <SectionTab
                        sectionId={currentTab.sectionId}
                        openTab={openTab}
                        blockRefreshKey={blockRefreshKey}
                    />

                )}

            </div>

        </div>
    );
}