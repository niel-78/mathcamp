import { useState } from "react";
import LeftCol from "./TeacherDashboard/LeftCol";
import Main from "./TeacherDashboard/Main";

export default function TeacherDashboard() {

    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);


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
        <div className="grid grid-cols-[300px_1fr] h-screen">

            <LeftCol
                tabs={tabs}
                openTab={openTab}
                setTabs={setTabs}
                setActiveTab={setActiveTab}
            />

            <Main
                tabs={tabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setTabs={setTabs}
            />

        </div>
    );
}