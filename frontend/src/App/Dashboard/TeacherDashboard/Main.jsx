import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import TabBar from "./Main/TabBar";
import StartPage from "./Main/StartPage";
import ExamListTab from "./Main/ExamListTab";
import BlockBankTab from "./Main/BlockBankTab";
import BlockEditor from "@/components/ui/BlockEditor";
import GroupStudentsTab from "./Main/GroupStudentsTab";
import CentralContentTab from "./Main/CentralContentTab";
import StudentTab from "./Main/StudentTab";
import SectionTab from "./Main/SectionTab";
import ExamTab from "./Main/ExamTab";
import GroupExamLibraryTab from "./Main/GroupExamLibraryTab";
import GroupExamTab from "./Main/GroupExamTab";


export default function Main({
    tabs,
    activeTab,
    setActiveTab,
    setTabs,
    blockRefreshKey,
    openTab,
    area,
    hoverTarget
}) {
    
    const currentTab = tabs.find(t => t.id === activeTab);

    const [ selectedExamId,
            setSelectedExamId
            ] = useState(null);

    const { setNodeRef } = useDroppable({
        id: `panel-${area}`
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                h-full
                transition-all
                ${
                    hoverTarget === `panel-${area}`
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : ""
                }
            `}
        >
                            
            <div className="flex flex-col">

                <TabBar
                    tabs={tabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setTabs={setTabs}
                    area={area}
                />

                <div className="p-4 flex-1 overflow-auto">

                    {currentTab?.type === "home" && (
                        <StartPage
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                        />
                    )}

                    {currentTab?.type === "exams" && (

                        <ExamListTab
                            selectedExamId={selectedExamId}
                            onSelectExam={setSelectedExamId}
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
                            blockRefreshKey={blockRefreshKey}
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
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
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
                            openTab={(tab) =>
                                openTab(tab, area)
                            }
                            blockRefreshKey={blockRefreshKey}
                        />

                    )}

                    {   currentTab?.type === "exam" && (

                            <ExamTab
                                examId={currentTab.examId}
                                openTab={(tab) =>
                                    openTab(tab, area)
                                }
                            />

                    )}
                        
                    {   currentTab?.type === "group-exams" && (

                            <GroupExamLibraryTab
                                openTab={(tab) =>
                                    openTab(tab, area)
                                }
                            />

                    )}

                    {   currentTab?.type === "group-exam" && (

                            <GroupExamTab
                                groupExamId={currentTab.groupExamId}
                                openTab={(tab) =>
                                    openTab(tab, area)
                                }
                            />

                    )}
                    
                    
                </div>

            </div>
        </div>
    );
}