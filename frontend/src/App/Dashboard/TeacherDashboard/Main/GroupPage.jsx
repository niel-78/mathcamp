import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import StudentList from "./GroupPage/StudentList";
import GroupExamList from "./GroupPage/GroupExamList";

export default function GroupPage() {

    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [studentEditMode,setStudentEditMode] = useState(false);

    const loadGroups = async () => {

        const response = await fetch(
            `${API_URL}/api/teacher/groups`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        setGroups(data);
    };

    const loadGroup = async (group) => {

        const response = await fetch(
            `${API_URL}/api/teacher/groups/${group.id}/full`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        setSelectedGroup(data);
    };

    const selectGroup = async (group) => {

        if (selectedGroup?.id === group.id) {
            setSelectedGroup(null);
            return;
        }

        loadGroup(group);

    };

    const renameGroup = async () => {

        const name = window.prompt(
            "Nytt gruppnamn:",
            selectedGroup.name
        );

        if (!name?.trim()) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/groups/${selectedGroup.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    name
                })
            }
        );

        loadGroup(selectedGroup);
        loadGroups();
    };

    const archiveGroup = async (groupId) => {

        const confirmed = window.confirm(
            "Arkivera gruppen?"
        );

        if (!confirmed) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/groups/${groupId}/archive`,
            {
                method: "PUT",
                headers: authHeaders()
            }
        );

        setSelectedGroup(null);

        loadGroups();
    };

    const deleteGroup = async (groupId) => {

        const confirmed = window.confirm(
            "Ta bort gruppen permanent?"
        );

        if (!confirmed) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/groups/${groupId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        setSelectedGroup(null);

        loadGroups();
    };

    const createGroup = async () => {

        const name = window.prompt(
            "Namn på den nya gruppen:"
        );

        if (!name?.trim()) {
            return;
        }

        await fetch(
            `${API_URL}/api/teacher/groups`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    name
                })
            }
        );

        loadGroups();
    };


    useEffect(() => {
        loadGroups();
    }, []);

    return (
        <div className="">

            <div className="card">
                <h2>Grupper</h2>

                <div className="flex gap-2 mb-4">

                    <button
                        className="btn-primary"
                        onClick={createGroup}
                    >
                        Ny grupp
                    </button>

                </div>
                
                <table className="table">
                    <thead>
                        <tr>
                            <th>Namn</th>
                            <th>Beskrivning</th>
                            <th>Skapad</th>
                        </tr>
                    </thead>

                    <tbody>
                        {groups.map(group => (
                            <tr
                                key={group.id}
                                onClick={() => selectGroup(group)}
                                className="
                                    cursor-pointer
                                    hover:bg-gray-50
                                "
                            >
                                <td>{group.name}</td>

                                <td>
                                    {group.description || "-"}
                                </td>

                                <td>
                                    {
                                        group.created_at
                                            ?.substring(0, 10)
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card">

                {selectedGroup && (
                    <div className="group-details">

                        <h2>{selectedGroup.name}</h2>

                        <div className="flex gap-2 mb-4">

                            <button
                                className="btn-action"
                                onClick={() => setStudentEditMode(
                                    !studentEditMode)
                                }
                            >
                            {studentEditMode
                                ? "Klar"
                                : "Redigera elever"}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={renameGroup}
                            >
                                Byt namn
                            </button>

                            <button
                                className="btn-primary"
                                onClick={() =>
                                    archiveGroup(selectedGroup.id)
                                }
                            >
                                Arkivera
                            </button>

                            <button
                                className="btn-danger"
                                onClick={() =>
                                    deleteGroup(selectedGroup.id)
                                }
                            >
                                Ta bort
                            </button>

                        </div>

                        <StudentList
                            group={selectedGroup}
                            editMode={studentEditMode}
                            onChanged={() =>
                                loadGroup(
                                    selectedGroup.id
                                )
                            }
                        />

                        <GroupExamList
                            group={selectedGroup}
                            onChanged={() =>
                                loadGroup(
                                    selectedGroup.id
                                )
                            }
                        />

                    </div>
                )}

            </div>

        </div>
    );
}