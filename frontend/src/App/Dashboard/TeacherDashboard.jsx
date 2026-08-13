import { useEffect, useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter
} from "@dnd-kit/core";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { authHeaders } from "@/api/authHeaders";
import { API_URL } from "@/config";
import LeftCol from "./TeacherDashboard/LeftCol";
import AppHeader from "./TeacherDashboard/AppHeader";
import Main from "./TeacherDashboard/Main";
import { toast } from "sonner";

export default function TeacherDashboard() {

    const [splitView, setSplitView] = useState(false);
    const [activeBlock, setActiveBlock] = useState(null);
    const [activeDragType, setActiveDragType] = useState(null);

    const [darkMode, setDarkMode] =
    useState(
        document.documentElement
            .classList.contains("dark")
    );

    useEffect(() => {

        localStorage.setItem(
            "theme",
            darkMode
                ? "dark"
                : "light"
        );

    }, [darkMode]);

    const [leftTabs, setLeftTabs] =
        useState(() => {

            const saved =
                localStorage.getItem(
                    "leftTabs"
                );

            return saved
                ? JSON.parse(saved)
                : [];

        });

    const [rightTabs, setRightTabs] =
        useState(() => {

            const saved =
                localStorage.getItem(
                    "rightTabs"
                );

            return saved
                ? JSON.parse(saved)
                : [];

        });

    const [activeLeftTab, setActiveLeftTab] =
        useState(
            localStorage.getItem(
                "activeLeftTab"
            )
        );

    const [activeRightTab, setActiveRightTab] =
        useState(
            localStorage.getItem(
                "activeRightTab"
            )
        );

    const [hoverTarget, setHoverTarget] = useState(null);
    const [blockRefreshKey, setBlockRefreshKey] = useState(0);

    useEffect(() => {

        localStorage.setItem(
            "leftTabs",
            JSON.stringify(leftTabs)
        );

    }, [leftTabs]);

    useEffect(() => {

        localStorage.setItem(
            "rightTabs",
            JSON.stringify(rightTabs)
        );

    }, [rightTabs]);

    useEffect(() => {

        localStorage.setItem(
            "activeLeftTab",
            activeLeftTab ?? ""
        );

    }, [activeLeftTab]);

    useEffect(() => {

        localStorage.setItem(
            "activeRightTab",
            activeRightTab ?? ""
        );

    }, [activeRightTab]);

    useEffect(() => {

        if (leftTabs.length === 0) {

            setLeftTabs([
                {
                    id: "start",
                    title: "Start",
                    type: "home"
                }
            ]);

            setActiveLeftTab("start");

        }

    }, [leftTabs]);


    const openTab = (
        tab,
        area = "left"
    ) => {

        const tabsInArea =
            area === "left"
                ? leftTabs
                : rightTabs;

        const setTabsInArea =
            area === "left"
                ? setLeftTabs
                : setRightTabs;

        const setActiveTabInArea =
            area === "left"
                ? setActiveLeftTab
                : setActiveRightTab;

        const exists =
            tabsInArea.find(
                t => t.id === tab.id
            );

        if (exists) {

            setActiveTabInArea(
                tab.id
            );

            return;

        }

        setTabsInArea(prev => [
            ...prev,
            tab
        ]);

        setActiveTabInArea(
            tab.id
        );

    };


    const handleDragEnd = async ({
        active,
        over
    }) => {

        if (!over) {
            return;
        }

        /*
        Lägga boksektion i lektionsplanering
        */
        if (
            active.data.current?.type === "section" &&
            over?.id?.startsWith("lesson-")
        ) {

            const lessonId = Number(
                over.id.replace(
                    "lesson-",
                    ""
                )
            );

            const sectionId =
                active.data.current.sectionId;

                try {

                    const response = await fetch(
                        `${API_URL}/api/lessons/lesson-sections`,
                        {
                            method: "POST",
                            headers: {
                                ...authHeaders(),
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                lesson_id: lessonId,
                                section_id: sectionId
                            })
                        }
                    );

                    if (response.status === 409) {

                        toast.error(
                            "Sektionen finns redan i lektionen."
                        );

                        return;

                    }

                    window.dispatchEvent(
                        new Event("lesson-section-added")
                    );

                } catch (error) {

                    console.error(error);

                }


            return;

        }

        /*
        Lägga boksektion från lektion till annan lektion
        */
        if (
            active.data.current?.type ===
                "lesson-section" &&
            over?.id?.startsWith("lesson-")
        ) {

            const targetLessonId =
                Number(
                    over.id.replace(
                        "lesson-",
                        ""
                    )
                );

            const sectionId =
                active.data.current.sectionId;

            const sourceLessonId =
                active.data.current.lessonId;

            const response =
                await fetch(
                    `${API_URL}/api/lessons/move-section`,
                    {
                        method: "POST",
                        headers: {
                            ...authHeaders(),
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            section_id: sectionId,
                            source_lesson_id:
                                sourceLessonId,
                            target_lesson_id:
                                targetLessonId
                        })
                    }
                );

            if (response.status === 409) {

                toast.error(
                    "Sektionen finns redan i lektionen."
                );

                return;

            }

            window.dispatchEvent(
                new Event(
                    "lesson-section-added"
                )
            );

            return;

        }


        /*
        Importera block från blockTab till examTab
        */
        if (
            active.data.current?.type === "block" &&
            over?.id?.startsWith("exam-")
        ) {

            const examId = Number(
                over.id.replace("exam-", "")
            );

            const blockId =
                active.data.current.blockId;

            await fetch(
                `${API_URL}/api/exams/${examId}/import-block`,
                {
                    method: "POST",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        block_id: blockId
                    })
                }
            );

            window.dispatchEvent(
                new Event("exam-block-added")
            );

            return;
        }

        /*
        * Flytta tabbar mellan vänster/höger vy
        */
        if (
            String(active.id).startsWith("tab-") &&
            String(over.id).startsWith("tab-panel-")
        ) {

            const {
                tab,
                sourceArea
            } = active.data.current;

            const targetArea =
                over.id.replace(
                    "tab-panel-",
                    ""
                );

            if (
                sourceArea === targetArea
            ) {
                return;
            }

            const sourceTabs =
                sourceArea === "left"
                    ? leftTabs
                    : rightTabs;

            const sourceIndex =
                sourceTabs.findIndex(
                    t => t.id === tab.id
                );

            const remainingTabs =
                sourceTabs.filter(
                    t => t.id !== tab.id
                );

            // Aktivera föregående tabb i källpanelen

            if (
                sourceArea === "left" &&
                activeLeftTab === tab.id
            ) {

                if (remainingTabs.length) {

                    const newIndex =
                        Math.max(
                            0,
                            sourceIndex - 1
                        );

                    setActiveLeftTab(
                        remainingTabs[newIndex].id
                    );

                } else {

                    setActiveLeftTab(null);

                }

            }

            if (
                sourceArea === "right" &&
                activeRightTab === tab.id
            ) {

                if (remainingTabs.length) {

                    const newIndex =
                        Math.max(
                            0,
                            sourceIndex - 1
                        );

                    setActiveRightTab(
                        remainingTabs[newIndex].id
                    );

                } else {

                    setActiveRightTab(null);

                }

            }

            // Flytta tabben

            if (sourceArea === "left") {

                setLeftTabs(remainingTabs);

                setRightTabs(prev => {

                    const exists =
                        prev.some(
                            t => t.id === tab.id
                        );

                    if (exists) {
                        return prev;
                    }

                    return [...prev, tab];

                });

                setActiveRightTab(
                    tab.id
                );

            } else {

                setRightTabs(remainingTabs);

                setLeftTabs(prev => {

                    const exists =
                        prev.some(
                            t => t.id === tab.id
                        );

                    if (exists) {
                        return prev;
                    }

                    return [...prev, tab];

                });

                setActiveLeftTab(
                    tab.id
                );

            }

            return;

        }

        /*
        * Flytta tabbar inom samma panel
        */
        if (
            active.data.current?.type === "tab" &&
            String(over.id).startsWith("tab-")
        ) {

            const {
                tab,
                sourceArea
            } = active.data.current;

            const tabs =
                sourceArea === "left"
                    ? [...leftTabs]
                    : [...rightTabs];

            const targetTabId =
                over.id.replace("tab-", "");

            const oldIndex =
                tabs.findIndex(
                    t => String(t.id) === String(tab.id)
                );

            const newIndex =
                tabs.findIndex(
                    t => String(t.id) === String(targetTabId)
                );;

            if (
                oldIndex === -1 ||
                newIndex === -1
            ) {
                return;
            }

            const reordered = [...tabs];

            const [moved] =
                reordered.splice(
                    oldIndex,
                    1
                );

            reordered.splice(
                newIndex,
                0,
                moved
            );

            if (sourceArea === "left") {

                setLeftTabs(reordered);

            } else {

                setRightTabs(reordered);

            }

            return;
        }



        /*
        Flytta block i examTab
        */
        if (
            active.data.current?.type === "exam-block" &&
            over?.id?.startsWith("exam-block-")
        ) {

            const draggedId =
                active.data.current.blockId;

            const targetId =
                Number(
                    over.id.replace(
                        "exam-block-",
                        ""
                    )
                );

                window.dispatchEvent(
                    new CustomEvent(
                        "exam-block-moved",
                        {
                            detail: {
                                draggedId,
                                targetId
                            }
                        }
                    )
                );

                return;
        }



        /*
        * Befintlig block-dragging
        */

        const blockId =
            active.data.current?.blockId;

        if (!blockId) {
            return;
        }

        if (
            String(over.id).startsWith("section-")
        ) {

            const sectionId =
                Number(
                    over.id.slice(8)
                );

            await fetch(
                `${API_URL}/api/blocks/${blockId}/book-sections/${sectionId}`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

            setBlockRefreshKey(
                prev => prev + 1
            );
        }
        if (
            String(over.id).startsWith("ability-")
        ) {

            const abilityId =
                Number(
                    over.id.replace(
                        "ability-",
                        ""
                    )
                );

            await fetch(
                `${API_URL}/api/blocks/${blockId}/abilities/${abilityId}`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

            setBlockRefreshKey(
                prev => prev + 1
            );

            return;
        }

    };

    return (

        <DndContext
            collisionDetection={closestCenter}
            onDragStart={({ active }) => {

                const type =
                    active.data.current?.type;

                setActiveDragType(type);

                if (active.data.current?.block) {

                    setActiveBlock(
                        active.data.current.block
                    );

                }

            }}
            onDragOver={(event) => {

                setHoverTarget(
                    event.over?.id ?? null
                );

            }}
            onDragEnd={(event) => {

                setActiveDragType(null);

                setActiveBlock(null);

                setHoverTarget(null);

                handleDragEnd(event);

            }}
        >

            <div className="h-screen">

                <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full w-full"
                >

                    <ResizablePanel
                        defaultSize={20}
                    >

                        <div
                            className="
                                h-full
                                overflow-y-auto
                            "
                        >

                            <LeftCol
                                tabs={leftTabs}
                                openTab={openTab}
                                setTabs={setLeftTabs}
                                setActiveTab={setActiveLeftTab}
                                hoverTarget={hoverTarget}
                            />

                        </div>

                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel
                        defaultSize={80}
                    >

                        <div
                            className="
                                h-full
                                flex
                                flex-col
                                min-h-0
                            "
                        >

                            <div
                                className="
                                    p-2
                                    border-b
                                "
                            >

                                <AppHeader
                                    splitView={splitView}
                                    setSplitView={setSplitView}
                                />

                            </div>

                            <div
                                className="
                                    flex-1
                                    overflow-hidden
                                    min-h-0
                                "
                            >

                                {!splitView ? (

                                    <Main
                                        area="left"
                                        activeDragType={activeDragType}
                                        hoverTarget={hoverTarget}
                                        tabs={leftTabs}
                                        activeTab={activeLeftTab}
                                        setActiveTab={setActiveLeftTab}
                                        setTabs={setLeftTabs}
                                        openTab={openTab}
                                        blockRefreshKey={blockRefreshKey}
                                    />

                                ) : (

                                    <ResizablePanelGroup
                                        direction="horizontal"
                                        className="
                                            h-full
                                            min-h-0
                                        "
                                    >

                                        <ResizablePanel
                                            defaultSize={50}
                                        >

                                            <Main
                                                area="left"
                                                activeDragType={activeDragType}
                                                hoverTarget={hoverTarget}
                                                tabs={leftTabs}
                                                activeTab={activeLeftTab}
                                                setActiveTab={setActiveLeftTab}
                                                setTabs={setLeftTabs}
                                                openTab={openTab}
                                                blockRefreshKey={blockRefreshKey}
                                            />

                                        </ResizablePanel>

                                        <ResizableHandle />

                                        <ResizablePanel
                                            defaultSize={50}
                                        >

                                            <Main
                                                area="right"
                                                activeDragType={activeDragType}
                                                hoverTarget={hoverTarget}
                                                tabs={rightTabs}
                                                activeTab={activeRightTab}
                                                setActiveTab={setActiveRightTab}
                                                setTabs={setRightTabs}
                                                openTab={openTab}
                                                blockRefreshKey={blockRefreshKey}
                                            />

                                        </ResizablePanel>

                                    </ResizablePanelGroup>

                                )}

                            </div>

                        </div>

                    </ResizablePanel>

                </ResizablePanelGroup>

            </div>

            <DragOverlay>

                {activeBlock && (

                    <div
                        className="
                            card
                            w-[500px]
                            pointer-events-none
                        "
                    >

                        {activeBlock.questions?.[0]?.question}

                    </div>

                )}

            </DragOverlay>

        </DndContext>

    );
}