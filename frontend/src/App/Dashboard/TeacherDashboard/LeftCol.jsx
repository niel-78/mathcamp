import { useEffect, useState } from "react";

import { API_URL } from "@/config";

export default function LeftCol( {openTab} ) {

    const [groups, setGroups] = useState([]);
    const [show, setShow] = useState({
        groups: false,
        exams: false,
        courses: false,
    });
    const [expandedGroups, setExpandedGroups] = useState({});

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {

        const response = await fetch(
            `${API_URL}/api/teacher/groups`,
            {
                headers: {
                    Authorization:
                        localStorage.getItem("token")
                }
            }
        );

        const data = await response.json();

        setGroups(data);
    };

    const toggle = (name) => {
        setShow(prev => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const toggleFolder = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId],
        }));
    };

    return (
        <div className="border-r p-4">


            <button className="tree-folder" 
                    onClick={() => toggle("groups")}
            >    
                {show.groups ? "▼" : "▶"} Grupper
            </button>

            {show.groups && (
                <ul>

                    {groups.map(group => (

                        <li key={group.id}>

                            <button
                                className="tree-node ml-4"
                                onClick={() =>
                                    toggleFolder(group.id)
                                }
                            >
                                {expandedGroups[group.id]
                                    ? "▼"
                                    : "▶"}

                                {" "}

                                {group.name}
                            </button>

                            {expandedGroups[group.id] && (
                                <div className="ml-8 border-l border-slate-300 pl-4">

                                    <div className="tree-file">
                                        Kommande prov
                                    </div>
                                    <div className="tree-file">
                                        Aktivitet
                                    </div>
                                    <div className="tree-file">
                                        Resultat
                                    </div>
                                    <div
                                        className="tree-file"
                                        onClick={() =>
                                            openTab({
                                                id: `group-${group.id}-students`,
                                                type: "group-students",
                                                title: `${group.name} - Elever`,
                                                groupId: group.id
                                            })
                                        }
                                    >
                                        Elever
                                    </div>
                                    <div className="tree-file">
                                        Inställningar
                                    </div>
                                </div>
                            )}

                        </li>

                    ))}

                </ul>
            )}

            <button className="tree-folder"
                    onClick={() => toggle("exams")}
            >
                {show.exams ? "▼" : "▶"} Prov
            </button>

            <button className="tree-folder"
                    onClick={() => toggle("courses")}
            >
                {show.courses ? "▼" : "▶"} Kurser
            </button>

        </div> 
    ); 

}