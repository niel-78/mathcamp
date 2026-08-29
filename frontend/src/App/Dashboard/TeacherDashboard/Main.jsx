import { useState } from "react";
import TabBar from "./Main/TabBar";
import StartPage from "./Main/StartPage";
import ExamListTab from "./Main/ExamListTab";
import BlockBankTab from "./Main/BlockBankTab";
import BlockContent from "@/App/Dashboard/TeacherDashboard/Main/BlockContent";
import QuestionCardTab from "./Main/QuestionCardTab";
import CentralContentTab from "./Main/CentralContentTab";
import SectionTab from "./Main/SectionTab";
import ExamTab from "./Main/ExamTab";
import GroupExamLibraryTab from "./Main/GroupExamLibraryTab";
import GroupExamTab from "./Main/GroupExamTab";
import GroupExamWaitingRoomTab from "./Main/GroupExamWaitingRoomTab";
import GroupExamMonitorTab from "./Main/GroupExamMonitorTab";
import AbilityTab from "./Main/AbilityTab";
import GroupPlanningTab from "./Main/GroupPlanningTab";
import ArchivedGroupsTab from "./Main/ArchivedGroupsTab";
import ArchivedStudentsTab from "./Main/ArchivedStudentsTab";
import ArchivedExamsTab from "./Main/ArchivedExamsTab";
import ArchivedQuestionsTab from "./Main/ArchivedQuestionsTab";
import ArchivedBlocksTab from "./Main/ArchivedBlocksTab";
import GroupSchedulesTab from "./Main/GroupSchedulesTab";
import PlanningQueueTab from "./Main/PlanningQueueTab"
import PresentationsTab from "./Main/PresentationsTab";
import PresentationEditorTab from "@/components/ui/PresentationEditorTab";
import PresentationPlayerTab from "@/components/ui/PresentationPlayerTab";
import ClassroomLayoutTab from "./Main/ClassroomLayoutTab";
import GroupLayoutTab from "./Main/GroupLayoutTab";
import TeacherCalendarTab from "@/components/tabs/TeacherCalenderTab";



export default function Main({
    tabs,
    activeTab,
    setActiveTab,
    setTabs,
    blockRefreshKey,
    openTab,
    area,
    activeDragType,
    hoverTarget
}) {
    
    const currentTab = tabs.find(t => t.id === activeTab);

    const [ selectedExamId,
            setSelectedExamId
            ] = useState(null);

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

        <div
            className={`
                h-full
                transition-all
            `}
        >

            <div
                className="
                    flex
                    flex-col
                    h-full
                    min-h-0
                "
            >

                <TabBar
                    tabs={tabs}
                    activeDragType={activeDragType}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setTabs={setTabs}
                    closeTab={closeTab}
                    area={area}
                />

                <div
                    className="
                        flex-1
                        overflow-hidden
                        min-h-0
                    "
                >
                    {currentTab?.type === "home" && (
                        <StartPage
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                        />
                    )}

                    {currentTab?.type === "teacher-calendar" && (

                        <TeacherCalendarTab
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                        />

                    )}

                    {currentTab?.type === "assessments" && (

                        <ExamListTab
                            selectedExamId={selectedExamId}
                            onSelectExam={setSelectedExamId}
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                        />

                    )}

                    {currentTab?.type === "assessment" && (

                        <ExamTab
                            assessmentId={currentTab.assessmentId}
                            assessmentTitle={currentTab.title}
                            activeDragType={activeDragType}
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                        />

                    )}

                    {currentTab?.type === "blocks" && (

                        <BlockBankTab
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                            blockRefreshKey={
                                blockRefreshKey
                            }
                        />

                    )}

                    {currentTab?.type === "block" && (

                        <BlockContent
                            block={currentTab.block}
                            area={area}
                            openTab={openTab}
                            closeTab={closeTab}
                        />

                    )}

                    {currentTab?.type === "question" && (

                        <QuestionCardTab
                            questionId={
                                currentTab.questionId
                            }
                            tabId={currentTab.id}
                            closeTab={closeTab}
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
                            areaTitle={
                                currentTab.areaTitle
                            }
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                            blockRefreshKey={
                                blockRefreshKey
                            }
                        />

                    )}

                    {currentTab?.type === "book-section" && (

                        <SectionTab
                            sectionId={
                                currentTab.sectionId
                            }
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                            blockRefreshKey={
                                blockRefreshKey
                            }
                        />

                    )}

                    {currentTab?.type === "ability" && (

                        <AbilityTab
                            abilityId={
                                currentTab.abilityId
                            }
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                            blockRefreshKey={
                                blockRefreshKey
                            }
                        />

                    )}

                    {currentTab?.type === "group-assessments" && (

                        <GroupExamLibraryTab
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                        />

                    )}

                    {currentTab?.type === "group-assessment" && (

                        <GroupExamTab
                            groupExamId={
                                currentTab.groupExamId
                            }
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                        />

                    )}

                    {currentTab?.type === "group-assessment-waiting-room" && (

                        <GroupExamWaitingRoomTab
                            groupExamId={
                                currentTab.groupExamId
                            }
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                        />

                    )}
                    {currentTab?.type === "group-assessment-monitor" && (

                        <GroupExamMonitorTab
                            groupExamId={
                                currentTab.groupExamId
                            }
                        />

                    )}
                    {currentTab?.type === "group-planning" && (

                        <GroupPlanningTab
                            groupId={currentTab.groupId}
                            openTab={openTab}
                        />

                    )}
                    {currentTab?.type === "group-schedules" && (

                        <GroupSchedulesTab
                            groupId={currentTab.groupId}
                        />

                        )
                    }
                    {currentTab?.type === "planning-queue" && (

                        <PlanningQueueTab
                            groupId={currentTab.groupId}
                        />

                    )}
                    {currentTab?.type === "archived-questions" && (

                        <ArchivedQuestionsTab />

                    )}
                    {currentTab?.type === "archived-groups" && (

                        <ArchivedGroupsTab />

                    )}
                    {currentTab?.type === "archived-students" && (

                        <ArchivedStudentsTab />

                    )}
                    {currentTab?.type === "archived-assessments" && (

                        <ArchivedExamsTab />

                    )}
                    {currentTab?.type === "archived-questions" && (

                        <ArchivedQuestionsTab />

                    )}
                    {currentTab?.type === "archived-blocks" && (

                        <ArchivedBlocksTab />

                    )}
                    {currentTab?.type === "presentations" && (

                        <PresentationsTab 
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                        />

                    )}
                    {currentTab?.type === "presentation-editor" && (

                        <PresentationEditorTab
                            presentation={
                                currentTab.presentation
                            }
                            openTab={openTab}
                        />
                    )}
                    {currentTab?.type === "presentation-player" && (

                        <PresentationPlayerTab
                            presentationId={
                                currentTab.presentationId
                            }
                        />

                    )}
                    {currentTab?.type === "classroom-layout" && (

                        <ClassroomLayoutTab
                            layoutId={currentTab.layoutId}
                        />

                    )}
                    {currentTab?.type === "group-layout" && (

                        <GroupLayoutTab
                            groupId={currentTab.groupId}
                            layoutId={currentTab.layoutId}
                            isActive={
                                currentTab?.id === activeTab
                            }
                        />

                    )}

                </div>

            </div>

        </div>

    );
}