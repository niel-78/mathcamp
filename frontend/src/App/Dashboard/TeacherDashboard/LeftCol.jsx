import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import UserProfile from "@/components/ui/UserProfile";
import CreateGroupDialog from "./LeftCol/CreateGroupDialog";
import RenameGroupDialog from "./LeftCol/RenameGroupDialog";
import ArchiveGroupDialog from "./LeftCol/ArchiveGroupDialog";
import CreateStudentDialog from "./LeftCol/CreateStudentDialog";
import RenameStudentDialog from "./LeftCol/RenameStudentDialog";
import ResetPasswordDialog from "./LeftCol/ResetPasswordDialog";
import ArchiveStudentDialog from "./LeftCol/ArchiveStudentDialog";
import SectionTreeItem from "@/components/ui/SectionTreeItem";
import CentralContentTreeItem from "@/components/ui/CentralContentTreeItem";

export default function LeftCol( {openTab, hoverTarget} ) {

    const [groups, setGroups] = useState([]);
    const [show, setShow] = useState({
        groups: false,
        subjects: false,
        exams: false,
        courses: false,
        books: false,
    });
    const [expandedGroups, setExpandedGroups] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [expandedLevels, setExpandedLevels] = useState({});
    const [expandedAreas, setExpandedAreas] = useState({});
    const [contextMenu, setContextMenu] = useState(null);
    const [showCreateGroupDialog,setShowCreateGroupDialog] = useState(false);
    const [renameDialog, setRenameDialog] = useState(null);
    const [archiveDialog, setArchiveDialog] = useState(null);
    const [groupStudents, setGroupStudents] = useState({});
    const [expandedStudents, setExpandedStudents] = useState({});
    const [createStudentDialog, setCreateStudentDialog] = useState(null);
    const [passwordDialog, setPasswordDialog] = useState(null);
    const [renameStudentDialog, setRenameStudentDialog] = useState(null);
    const [archiveStudentDialog, setArchiveStudentDialog] = useState(null);
    const [books, setBooks] = useState([]);
    const [expandedBooks, setExpandedBooks] = useState({});
    const [expandedChapters, setExpandedChapters] = useState({});
    const [expandedSubchapters, setExpandedSubchapters] = useState({});
    

    useEffect(() => {
        loadGroups();
        loadSubjects();
        loadBooks();
    }, []);

    useEffect(() => {

        const handleClick = () =>
            setContextMenu(null);

        window.addEventListener(
            "click",
            handleClick
        );

        return () =>
            window.removeEventListener(
                "click",
                handleClick
            );

    }, []);

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

    const loadStudents = async (groupId) => {

        const response = await fetch(
            `${API_URL}/api/teacher/groups/${groupId}/full`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        setGroupStudents((prev) => ({
            ...prev,
            [groupId]: data.students,
        }));

    };

    const loadSubjects = async () => {

        const response = await fetch(
            `${API_URL}/api/subjects/full`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();
        setSubjects(data);
    };

    const loadBooks = async () => {

        const response = await fetch(
            `${API_URL}/api/books`
        );

        const data = await response.json();

        setBooks(data);

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

    const toggleStudents = async (groupId) => {
        if (!groupStudents[groupId]) {
            const response = await fetch(
                `${API_URL}/api/teacher/groups/${groupId}/full`,
                {
                    headers:authHeaders()
                }
            );

            const data = await response.json();

            setGroupStudents((prev) => ({
                ...prev,
                [groupId]: data.students,
            }));
        }

        setExpandedStudents((prev) => ({
            ...prev,
            [groupId]: !prev[groupId],
        }));
    };


    const toggleSubject = (subjectId) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subjectId]: !prev[subjectId],
        }));
    };

    const toggleLevel = (levelId) => {
        setExpandedLevels(prev => ({
            ...prev,
            [levelId]: !prev[levelId],
        }));
    };

    const toggleArea = (areaId) => {
        setExpandedAreas(prev => ({
            ...prev,
            [areaId]: !prev[areaId],
        }));
    };

    return (
        <>
            <UserProfile />
            {
                contextMenu && (

                    <div
                        className="
                            fixed
                            bg-white
                            border
                            rounded
                            shadow-lg
                            z-50
                            min-w-40
                        "
                        style={{
                            left: contextMenu.x,
                            top: contextMenu.y
                        }}
                    >

                        {contextMenu.type === "groups" && (

                            <Button
                                className="
                                    block
                                    w-full
                                    p-2
                                    text-left
                                    hover:bg-slate-100
                                "
                                onClick={() => {

                                    setShowCreateGroupDialog(true);
                                    setContextMenu(null);

                                }}
                            >
                                Ny grupp
                            </Button>

                        )}

                        {contextMenu.type === "group" && (

                            <>
                                <div className="px-3 py-2 text-sm text-gray-500 border-b">
                                    {contextMenu.groupName}
                                </div>

                                <Button
                                    className="
                                        block
                                        w-full
                                        p-2
                                        text-left
                                        hover:bg-slate-100
                                    "
                                    onClick={() => {

                                        setRenameDialog({
                                            id: contextMenu.groupId,
                                            name: contextMenu.groupName
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Byt namn
                                </Button>

                                <Button
                                    className="
                                        block
                                        w-full
                                        p-2
                                        text-left
                                        hover:bg-slate-100
                                    "
                                    onClick={() => {

                                        setArchiveDialog({
                                            id: contextMenu.groupId,
                                            name: contextMenu.groupName
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Arkivera
                                </Button>
                            </>

                        )}

                        {contextMenu?.type === "students" && (

                            <Button
                                className="
                                    block
                                    w-full
                                    p-2
                                    text-left
                                    hover:bg-slate-100
                                "
                                onClick={() => {

                                    setCreateStudentDialog({
                                        groupId: contextMenu.groupId,
                                        groupName: contextMenu.groupName
                                    });

                                    setContextMenu(null);

                                }}
                            >
                                Lägg till elev
                            </Button>

                        )}

                        {contextMenu?.type === "student" && (

                            <>
                                <div className="px-3 py-2 text-sm text-gray-500 border-b">
                                    {contextMenu.firstName} {contextMenu.lastName}
                                </div>

                                <Button
                                    className="
                                        block
                                        w-full
                                        p-2
                                        text-left
                                        hover:bg-slate-100
                                    "
                                    onClick={() => {
                                        setPasswordDialog({
                                            id: contextMenu.userId,
                                            name: `${contextMenu.firstName} ${contextMenu.lastName}`
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Nytt lösenord
                                </Button>

                                <Button
                                    className="
                                        block
                                        w-full
                                        p-2
                                        text-left
                                        hover:bg-slate-100
                                    "
                                    onClick={() => {

                                        setRenameStudentDialog({
                                            id: contextMenu.userId,
                                            groupId: contextMenu.groupId,
                                            firstName: contextMenu.firstName,
                                            lastName: contextMenu.lastName
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Byt namn
                                </Button>

                                <Button
                                    className="
                                        block
                                        w-full
                                        p-2
                                        text-left
                                        hover:bg-slate-100
                                    "
                                    onClick={() => {

                                        setArchiveStudentDialog({
                                            userId: contextMenu.userId,
                                            groupId: contextMenu.groupId,
                                            name: `${contextMenu.firstName} ${contextMenu.lastName}`
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Arkivera
                                </Button>
                            </>

                        )}



                    </div>

                )
            }
            
            
            
            <div className="border-r p-4">

                <Button className="tree-folder" 
                        onClick={() => {
                            toggle("groups");
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                                type: "groups",
                                x: e.clientX,
                                y: e.clientY
                            });
                        }}
                >    
                    {show.groups ? "▼" : "▶"} Grupper
                </Button>

                {show.groups && (
                    <ul>

                        {groups.map(group => (

                            <li key={group.id}>

                                <Button
                                    className="tree-node ml-4"
                                    onClick={() =>
                                        toggleFolder(group.id)
                                    }
                                    onContextMenu={(e) => {

                                        e.preventDefault();

                                        setContextMenu({
                                            type: "group",
                                            groupId: group.id,
                                            groupName: group.name,
                                            x: e.clientX,
                                            y: e.clientY
                                        });

                                    }}
                                >
                                    {expandedGroups[group.id]
                                        ? "▼"
                                        : "▶"}

                                    {" "}

                                    {group.name}
                                </Button>

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

                                        <div>

                                        <div
                                            className="tree-file cursor-pointer"
                                            onClick={() =>
                                                toggleStudents(group.id)
                                            }
                                            onContextMenu={(e) => {

                                                e.preventDefault();

                                                setContextMenu({
                                                    type: "students",
                                                    groupId: group.id,
                                                    groupName: group.name,
                                                    x: e.clientX,
                                                    y: e.clientY
                                                });

                                            }}
                                        >
                                            {expandedStudents[group.id]
                                                ? "▼"
                                                : "▶"}

                                            {" "}
                                            Elever
                                        </div>

                                            {expandedStudents[group.id] && (

                                                <div className="ml-4">

                                                    {(groupStudents[group.id] || [])
                                                        .map(student => (

                                                            <div
                                                                key={student.id}
                                                                className="
                                                                    tree-file
                                                                    cursor-pointer
                                                                "
                                                                onClick={() =>
                                                                    openTab({
                                                                        id: `student-${student.id}`,
                                                                        type: "student",
                                                                        title: `${student.first_name} ${student.last_name}`,
                                                                        studentId: student.id
                                                                    })
                                                                }
                                                                onContextMenu={(e) => {

                                                                    e.preventDefault();

                                                                    setContextMenu({
                                                                        type: "student",
                                                                        userId: student.id,
                                                                        firstName: student.first_name,
                                                                        lastName: student.last_name,
                                                                        groupId: group.id,
                                                                        x: e.clientX,
                                                                        y: e.clientY
                                                                    });

                                                                }}
                                                            >
                                                                {student.first_name} {student.last_name}
                                                            </div>

                                                    ))}

                                                </div>

                                            )}

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

                <Button className="tree-folder"
                        onClick={() => toggle("exams")}
                >
                    {show.exams ? "▼" : "▶"} Prov
                </Button>


                <Button className="tree-folder" 
                    onClick={() =>
                        toggle("subjects")
                    }
                >
                    {show.subjects ? "▼" : "▶"} Ämnen
                </Button>

                {show.subjects && (

                    <div className="ml-4">

                        {subjects.map(subject => (

                            <div key={subject.id}>

                                <div
                                    className="tree-folder"
                                    onClick={() =>
                                        toggleSubject(subject.id)
                                    }
                                >
                                    {expandedSubjects[subject.id]
                                        ? "▼"
                                        : "▶"}
                                    {" "}
                                    {subject.name}
                                </div>

                                {expandedSubjects[subject.id] && (

                                    <div className="ml-4">

                                        {subject.levels.map(level => (

                                            <div key={level.id}>

                                                <div
                                                    className="tree-folder"
                                                    onClick={() =>
                                                        toggleLevel(level.id)
                                                    }
                                                >
                                                    {expandedLevels[level.id]
                                                        ? "▼"
                                                        : "▶"}
                                                    {" "}
                                                    {level.name}
                                                </div>

                                                {expandedLevels[level.id] && (

                                                    <div className="ml-4">

                                                        {level.areas.map(area => (

                                                            <div
                                                                key={area.id}
                                                            >

                                                                <div
                                                                    className="tree-folder"
                                                                    onClick={() =>
                                                                        toggleArea(area.id)
                                                                    }
                                                                >
                                                                    {expandedAreas[area.id]
                                                                        ? "▼"
                                                                        : "▶"}
                                                                    {" "}
                                                                    {area.title}
                                                                </div>

                                                                {expandedAreas[area.id] && (

                                                                    <div className="ml-4">

                                                                        {area.centralContent.map(item => (

                                                                            <CentralContentTreeItem
                                                                                key={item.id}
                                                                                item={item}
                                                                                level={level}
                                                                                openTab={openTab}
                                                                                hoverTarget={hoverTarget}
                                                                            />

                                                                        ))}

                                                                    </div>

                                                                )}

                                                            </div>

                                                        ))}

                                                    </div>

                                                )}

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </div>

                        ))}

                    </div>

                )}

                <Button className="tree-folder"
                    onClick={() => toggle("books")}
                >
                    {show.books ? "▼" : "▶"} Böcker
                </Button>

                {show.books && (

                    <div className="ml-4">

                        {books.map(book => (

                            <div key={book.id}>

                                <div
                                    className="tree-folder"
                                    onClick={() =>
                                        setExpandedBooks(prev => ({
                                            ...prev,
                                            [book.id]:
                                                !prev[book.id]
                                        }))
                                    }
                                >
                                    {expandedBooks[book.id]
                                        ? "▼"
                                        : "▶"}

                                    {" "}

                                    {book.title}
                                </div>

                                {expandedBooks[book.id] && (

                                    <div className="ml-4">

                                        {book.chapters.map(chapter => (

                                            <div key={chapter.id}>

                                                <div
                                                    className="tree-folder"
                                                    onClick={() =>
                                                        setExpandedChapters(prev => ({
                                                            ...prev,
                                                            [chapter.id]:
                                                                !prev[chapter.id]
                                                        }))
                                                    }
                                                >
                                                    {expandedChapters[chapter.id]
                                                        ? "▼"
                                                        : "▶"}

                                                    {" "}

                                                    {chapter.chapter_number}

                                                    {" "}

                                                    {chapter.title}
                                                </div>

                                                {expandedChapters[chapter.id] && (

                                                    <div className="ml-4">

                                                        {chapter.subchapters.map(
                                                            subchapter => (

                                                                <div
                                                                    key={subchapter.id}
                                                                >

                                                                    <div
                                                                        className="tree-folder"
                                                                        onClick={() =>
                                                                            setExpandedSubchapters(
                                                                                prev => ({
                                                                                    ...prev,
                                                                                    [subchapter.id]:
                                                                                        !prev[
                                                                                            subchapter.id
                                                                                        ]
                                                                                })
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            expandedSubchapters[
                                                                                subchapter.id
                                                                            ]
                                                                                ? "▼"
                                                                                : "▶"
                                                                        }

                                                                        {" "}

                                                                        {
                                                                            subchapter.subchapter_number
                                                                        }

                                                                        {" "}

                                                                        {
                                                                            subchapter.title
                                                                        }

                                                                    </div>

                                                                    {
                                                                        expandedSubchapters[
                                                                            subchapter.id
                                                                        ] && (

                                                                            <div className="ml-4">

                                                                                {subchapter.sections.map(
                                                                                    section => (

                                                                                    <SectionTreeItem
                                                                                        key={section.id}
                                                                                        section={section}
                                                                                        openTab={openTab}
                                                                                        hoverTarget={hoverTarget}
                                                                                    />

                                                                                    )
                                                                                )}

                                                                            </div>

                                                                        )
                                                                    }

                                                                </div>

                                                            )
                                                        )}

                                                    </div>

                                                )}

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </div>

                        ))}

                    </div>

                )}


            </div>    

            <ArchiveGroupDialog
                group={archiveDialog}
                open={!!archiveDialog}
                onOpenChange={() =>
                    setArchiveDialog(null)
                }
                onArchived={loadGroups}
            /> 

            <CreateGroupDialog
                open={showCreateGroupDialog}
                onOpenChange={setShowCreateGroupDialog}
                onCreated={loadGroups}
            />
            <RenameGroupDialog
                group={renameDialog}
                open={!!renameDialog}
                onOpenChange={() =>
                    setRenameDialog(null)
                }
                onRenamed={loadGroups}
            />
            <CreateStudentDialog
                group={createStudentDialog}
                open={!!createStudentDialog}
                onOpenChange={() =>
                    setCreateStudentDialog(null)
                }
                onCreated={() =>
                    loadStudents(
                        createStudentDialog.groupId
                    )
                }
            />
            <RenameStudentDialog
                student={renameStudentDialog}
                open={!!renameStudentDialog}
                onOpenChange={() =>
                    setRenameStudentDialog(null)
                }
                onRenamed={() =>
                    loadStudents(
                        renameStudentDialog.groupId
                    )
                }
            />

            <ResetPasswordDialog
                student={passwordDialog}
                open={!!passwordDialog}
                onOpenChange={() =>
                    setPasswordDialog(null)
                }
            />

            <ArchiveStudentDialog
                student={archiveStudentDialog}
                open={!!archiveStudentDialog}
                onOpenChange={() =>
                    setArchiveStudentDialog(null)
                }
                onArchived={() =>
                    loadStudents(
                        archiveStudentDialog.groupId
                    )
                }
            />
        </>
    )
}                