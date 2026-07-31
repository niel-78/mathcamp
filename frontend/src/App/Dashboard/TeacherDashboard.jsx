import { useState } from "react";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
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


    return (

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
                            setActiveTab={setActiveTab}/>
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
                        openTab={openTab}/>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>

    );
}