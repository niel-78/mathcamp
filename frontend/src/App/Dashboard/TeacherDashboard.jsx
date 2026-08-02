import { useState } from "react";
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
import Main from "./TeacherDashboard/Main";

export default function TeacherDashboard() {

    const [tabs, setTabs] = useState([
        {
            id: "home",
            title: "Start",
            type: "home"
        }
    ]);
    const [activeTab, setActiveTab] = useState("home");
    const [activeBlockId, setActiveBlockId] = useState(null);
    const [hoverTarget, setHoverTarget] = useState(null);

    const [blockRefreshKey, setBlockRefreshKey] = useState(0);

    const openTab = (tab) => {
        const exists = tabs.find(
            t => t.id === tab.id
        );

        if (exists) {
            setActiveTab(tab.id);
            return;
        }

        setTabs(prev => [...prev, tab]);
        setActiveTab(tab.id);
    };


    const handleDragStart = ({ active }) => {
        setActiveBlockId(active.id);
    };

    const handleDragEnd = async ({active,over}) => {

        if (!over) return;

        const blockId =
            active.data.current.blockId;

        if (over.id.startsWith("cc-")) {

            const centralContentId =
                Number(over.id.slice(3));

            await fetch(
                `${API_URL}/api/central-content/${centralContentId}/blocks/${blockId}`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

            setBlockRefreshKey(prev => prev + 1);


            return;
        }

        if (over.id.startsWith("section-")) {

            const sectionId =
                Number(over.id.slice(8));

            await fetch(
                `${API_URL}/api/sections/${sectionId}/blocks/${blockId}`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

            setBlockRefreshKey(prev => prev + 1);

        }

    };

    return (

            <DndContext
                collisionDetection={pointerWithin}
                onDragOver={({ over }) => {
                    setHoverTarget(over?.id ?? null);
                }}
                onDragEnd={handleDragEnd}
            >
                <div className="h-screen">
                    <ResizablePanelGroup
                        direction="horizontal"
                        className="h-full w-full"
                    >
                        <ResizablePanel 
                            defaultSize={20}
                        >
                            <div className="h-full overflow-y-auto">
                                <LeftCol 
                                    tabs={tabs}
                                    openTab={openTab}
                                    setTabs={setTabs}
                                    setActiveTab={setActiveTab}
                                    hoverTarget={hoverTarget}
                                />
                            </div>       
                        </ResizablePanel>

                        <ResizableHandle className="w-l bg-gray-300" />

                        <ResizablePanel
                            defaultSize={80} 
                        >
                            <Main 
                                tabs={tabs}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                setTabs={setTabs}
                                openTab={openTab}
                                blockRefreshKey={blockRefreshKey}
                            /> 
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </DndContext>    
        );
}