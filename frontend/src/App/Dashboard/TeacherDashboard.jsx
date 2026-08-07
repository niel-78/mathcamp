import { useEffect, useState } from "react";
import {
    DndContext,
    pointerWithin
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

export default function TeacherDashboard() {

    const [splitView, setSplitView] = useState(false);

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

        console.log("OVER ID", over.id);

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
            String(over.id).startsWith("panel-")
        ) {

            const {
                tab,
                sourceArea
            } = active.data.current;

            const targetArea =
                over.id.replace(
                    "panel-",
                    ""
                );

            if (
                sourceArea === targetArea
            ) {
                return;
            }

            if (sourceArea === "left") {

                setLeftTabs(prev =>
                    prev.filter(
                        t => t.id !== tab.id
                    )
                );

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

                setRightTabs(prev =>
                    prev.filter(
                        t => t.id !== tab.id
                    )
                );

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
            String(over.id).startsWith("cc-")
        ) {

            const centralContentId =
                Number(
                    over.id.slice(3)
                );

            await fetch(
                `${API_URL}/api/blocks/${blockId}/central-content/${centralContentId}`,
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

    };

    return (

        <DndContext
            collisionDetection={pointerWithin}
            onDragOver={({ over }) => {
                setHoverTarget(over?.id ?? null);
            }}
            onDragEnd={(event) => {
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

        </DndContext>

    );
}