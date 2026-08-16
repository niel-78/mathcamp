import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import UserProfile from "@/components/ui/UserProfile";
import CreateGroupDialog from "./LeftCol/CreateGroupDialog";
import RenameGroupDialog from "./LeftCol/RenameGroupDialog";
import ArchiveGroupDialog from "./LeftCol/ArchiveGroupDialog";
import CreateStudentDialog from "./LeftCol/CreateStudentDialog";
import RenameStudentDialog from "./LeftCol/RenameStudentDialog";
import ResetPasswordDialog from "./LeftCol/ResetPasswordDialog";
import ArchiveStudentDialog from "./LeftCol/ArchiveStudentDialog";
import ImportStudentsDialog from "./LeftCol/ImportStudentsDialog";
import SectionTreeItem from "@/components/ui/SectionTreeItem";
import CreateAbilityDialog from "./LeftCol/CreateAbilityDialog";
import CentralContentTreeItem from "@/components/ui/CentralContentTreeItem";
import AbilityTreeItem from "@/components/ui/AbilityTreeItem";
import RenameAbilityDialog from "./LeftCol/RenameAbilityDialog";
import DeleteAbilityDialog from "./LeftCol/DeleteAbilityDialog";
import CreateAbilitiesFromExcelDialog from "./LeftCol/CreateAbilitiesFromExcelDialog";
import CreateLessonSeriesDialog from "./LeftCol/CreateLessonSeriesDialog";
import ImportCriteriaDialog from "./LeftCol/ImportCriteriaDialog";
import ImportCentralContentDialog from "./LeftCol/ImportCentralContentDialog";
import CreateLevelDialog from "./LeftCol/CreateLevelDialog";
import ImportBookStructureDialog from "./LeftCol/ImportBookStructureDialog";
import CreateBookDialog from "./LeftCol/CreateBookDialog";
import CreateAbilitySeriesDialog from "./LeftCol/CreateAbilitySeriesDialog";
import RenameAbilitySeriesDialog from "./LeftCol/RenameAbilitySeriesDialog";
import ContextMenu from "./LeftCol/ContextMenu";

export default function LeftCol( {openTab, hoverTarget} ) {

    const [groups, setGroups] = useState([]);
    const [show, setShow] = useState({
        groups: false,
        subjects: false,
        exams: false,
        courses: false,
        books: false,
        abilities: false
    });
    const { user } = useAuth();
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
    const [abilitySeries, setAbilitySeries] = useState([]);
    const [expandedAbilitySeries, setExpandedAbilitySeries] = useState({});
    const [importStudentsDialog,setImportStudentsDialog] = useState(null);
    const [createAbilityDialog, setCreateAbilityDialog] = useState(null);
    const [importAbilitiesDialog, setImportAbilitiesDialog] = useState(null);
    const [renameAbilityDialog, setRenameAbilityDialog] = useState(null);
    const [deleteAbilityDialog, setDeleteAbilityDialog] = useState(null);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [createLessonSeriesDialog, setCreateLessonSeriesDialog] = useState(null);
    const [expandedBookSections, setExpandedBookSections] = useState({});
    const [expandedBookAbilities, setExpandedBookAbilities] = useState({});
    const [expandedCompetencies, setExpandedCompetencies] = useState({});
    const [expandedGrades,setExpandedGrades] = useState({});
    const [importCriteriaDialog,setImportCriteriaDialog] = useState(null);
    const [importCentralContentDialog, setImportCentralContentDialog] = useState(null);
    const [createLevelDialog, setCreateLevelDialog] = useState(null);
    const [importBookStructureDialog, setImportBookStructureDialog] = useState(null);
    const [createBookDialog, setCreateBookDialog] = useState(null);
    const [createAbilitySeriesDialog, setCreateAbilitySeriesDialog] = useState(false);
    const [renameAbilitySeriesDialog, setRenameAbilitySeriesDialog] = useState(null);

    useEffect(() => {
        loadGroups();
        loadSubjects();
        loadBooks();
        loadAbilitySeries();
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

    useEffect(() => {

        loadGroups();

        const reload = () => {
            loadGroups();
        };

        window.addEventListener(
            "group-restored",
            reload
        );

        return () => {

            window.removeEventListener(
                "group-restored",
                reload
            );

        };

    }, []);

    const loadGroups = async () => {

        const response = await fetch(
            `${API_URL}/api/groups`,
            {
                headers: authHeaders()
            }
        );

        const data = await response.json();

        setGroups(data);

    };

    const loadStudents = async (groupId) => {

        const response = await fetch(
            `${API_URL}/api/groups/${groupId}/students`,
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
            `${API_URL}/api/subjects/`,
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

    const loadAbilitySeries =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/ability-series`,
                    {
                        headers: authHeaders()
                    }
                );

            const data =
                await response.json();

            setAbilitySeries(data);
            console.log(data);

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
            loadStudents(groupId);
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

    const toggleBookSections = (groupId) => {
        setExpandedBookSections(prev => ({
            ...prev,
            [groupId]: !prev[groupId],
        }));
    };

    const toggleBookAbilities = async (
        groupId,
        bookId
    ) => {

        const group = groups.find(
            g => g.id === groupId
        );

        if (!group?.abilities) {
            await loadGroupAbilities(
                groupId,
                bookId
            );
        }

        setExpandedBookAbilities(prev => ({
            ...prev,
            [groupId]: !prev[groupId],
        }));
    };

    const [
        expandedAbilitySubjects,
        setExpandedAbilitySubjects
    ] = useState({});

    return (
        <>
            <UserProfile />


            <ContextMenu
                contextMenu={contextMenu}
                setContextMenu={setContextMenu}
                user={user}
                setCreateAbilityDialog={setCreateAbilityDialog}
                setImportAbilitiesDialog={setImportAbilitiesDialog}
                setRenameAbilitySeriesDialog={setRenameAbilitySeriesDialog}
                setRenameDialog={setRenameDialog}
                setArchiveDialog={setArchiveDialog}
                setPasswordDialog={setPasswordDialog}
                setRenameStudentDialog={setRenameStudentDialog}
                setArchiveStudentDialog={setArchiveStudentDialog}

                setCreateStudentDialog={setCreateStudentDialog}
                setImportStudentsDialog={setImportStudentsDialog}
            />


            <div
                className="
                    border-r
                    border-border

                    bg-sidebar
                    text-sidebar-foreground

                    p-4
                "
            >

                <Button className="tree-folder" 
                        variant="ghost"
                        size="lg"
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
                                    variant="ghost"
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
                                    <div className="ml-8 border-l border-border pl-4">

                                        {/* <div className="tree-file">
                                            Kommande prov
                                        </div>
                                        <div className="tree-file">
                                            Aktivitet
                                        </div>
                                        <div className="tree-file">
                                            Resultat
                                        </div> */}

                                        <div
                                            className="tree-file cursor-pointer"
                                            onClick={() =>
                                                openTab({
                                                    id: `group-planning-${group.id}`,
                                                    type: "group-planning",
                                                    title: `${group.name} - Planering`,
                                                    groupId: group.id,
                                                    group
                                                })
                                            }
                                            onContextMenu={(e) => {

                                                e.preventDefault();

                                                setContextMenu({
                                                    type: "planning",
                                                    groupId: group.id,
                                                    groupName: group.name,
                                                    x: e.clientX,
                                                    y: e.clientY
                                                });

                                            }}
                                        >
                                            Planering
                                        </div>

                                        {group.book_id && (
                                            <>
                                                <div
                                                    className="tree-file cursor-pointer"
                                                    onClick={() =>
                                                        toggleBookSections(group.id)
                                                    }
                                                >
                                                    {expandedBookSections[group.id] ? "▼" : "▶"} Sektioner
                                                </div>

                                                {expandedBookSections[group.id] && (
                                                    <div className="ml-4">

                                                        {(group.sections || []).map(section => (

                                                            <div
                                                                key={section.id}
                                                                className="tree-file cursor-pointer"
                                                            >
                                                                {section.title}
                                                            </div>

                                                        ))}

                                                    </div>
                                                )}

                                                <div
                                                    className="tree-file cursor-pointer"
                                                    onClick={() => toggleBookAbilities(group.id,group.book_id)}
                                                >
                                                    {expandedBookAbilities[group.id] ? "▼" : "▶"} Förmågor
                                                </div>

                                                {expandedBookAbilities[group.id] && (
                                                    <div className="ml-4">

                                                        {(group.abilities || []).map(ability => (

                                                        <div
                                                            className="tree-folder"
                                                            onClick={() =>
                                                                setExpandedAbilities(prev => ({
                                                                    ...prev,
                                                                    [`${level.id}-${abilityName}`]:
                                                                        !prev[`${level.id}-${abilityName}`]
                                                                }))
                                                            }
                                                        >
                                                            {
                                                                expandedAbilities[
                                                                    `${level.id}-${abilityName}`
                                                                ]
                                                                    ? "▼"
                                                                    : "▶"
                                                            }

                                                            {" "}

                                                            {abilityName}
                                                        </div>

                                                        ))}

                                                    </div>
                                                )}
                                            </>
                                        )}

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
                                                                        userName: student.username,
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
                        variant="ghost"
                        size="lg"
                        onClick={() => toggle("exams")}
                >
                    {show.exams ? "▼" : "▶"} Prov
                </Button>


                <Button className="tree-folder" 
                    variant="ghost"
                    size="lg"
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
                                    onContextMenu={(e) => {

                                        if (user?.role !== "super") {
                                            return;
                                        }

                                        e.preventDefault();

                                        setContextMenu({
                                            type: "subject",
                                            subjectId: subject.id,
                                            subjectName: subject.name,
                                            x: e.clientX,
                                            y: e.clientY
                                        });

                                    }}
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

                                                        <div
                                                            className="tree-folder"
                                                            onClick={() =>
                                                                setExpandedAreas(prev => ({
                                                                    ...prev,
                                                                    [`content-${level.id}`]:
                                                                        !prev[`content-${level.id}`]
                                                                }))
                                                            }
                                                            onContextMenu={(e) => {
                                                                if (user?.role !== "super") {
                                                                    return;
                                                                }
                                                                e.preventDefault();
                                                                setContextMenu({
                                                                    type: "central-content-level",
                                                                    levelId: level.id,
                                                                    levelName: level.name,
                                                                    x: e.clientX,
                                                                    y: e.clientY
                                                                });
                                                            }}
                                                        >
                                                            {
                                                                expandedAreas[`content-${level.id}`]
                                                                    ? "▼"
                                                                    : "▶"
                                                            }
                                                            {" "}
                                                            Centralt innehåll
                                                        </div>

                                                        {
                                                            expandedAreas[`content-${level.id}`] && (
                                                                <div className="ml-4">

                                                                    {level.areas.map(area => (

                                                                        <div key={area.id}>

                                                                            <div
                                                                                className="tree-folder"
                                                                                onClick={() =>
                                                                                    toggleArea(area.id)
                                                                                }
                                                                            >
                                                                                {
                                                                                    expandedAreas[area.id]
                                                                                        ? "▼"
                                                                                        : "▶"
                                                                                }
                                                                                {" "}
                                                                                {area.title}
                                                                            </div>

                                                                            {expandedAreas[area.id] && (
                                                                                <div className="ml-4">

                                                                                    {area.centralContent.map(
                                                                                        item => (
                                                                                            <CentralContentTreeItem
                                                                                                key={item.id}
                                                                                                item={item}
                                                                                                level={level}
                                                                                                openTab={openTab}
                                                                                                hoverTarget={hoverTarget}
                                                                                            />
                                                                                        )
                                                                                    )}

                                                                                </div>
                                                                            )}

                                                                        </div>

                                                                    ))}

                                                                </div>
                                                            )
                                                        }


                                                        <div
                                                            className="tree-folder"
                                                            onClick={() =>
                                                                setExpandedCompetencies(prev => ({
                                                                    ...prev,
                                                                    [level.id]: !prev[level.id]
                                                                }))
                                                            }
                                                            onContextMenu={(e) => {

                                                                if (user?.role !== "super") {
                                                                    return;
                                                                }

                                                                e.preventDefault();

                                                                setContextMenu({
                                                                    type: "criteria-level",
                                                                    levelId: level.id,
                                                                    levelName: level.name,
                                                                    x: e.clientX,
                                                                    y: e.clientY
                                                                });

                                                            }}
                                                        >
                                                            {expandedCompetencies[level.id]
                                                                ? "▼"
                                                                : "▶"}

                                                            {" "}

                                                            Betygskriterier
                                                        </div>


                                                        {expandedCompetencies[level.id] && (
                                                            <div className="ml-4">

                                                                {(level.competencies || []).map(
                                                                    competency => (

                                                                    <div key={competency.id}>

                                                                        <div
                                                                            className="tree-folder"
                                                                            onClick={() =>
                                                                                setExpandedAbilities(prev => ({
                                                                                    ...prev,
                                                                                    [`${level.id}-${competency.id}`]:
                                                                                        !prev[
                                                                                            `${level.id}-${competency.id}`
                                                                                        ]
                                                                                }))
                                                                            }
                                                                        >
                                                                            {
                                                                                expandedAbilities[
                                                                                    `${level.id}-${competency.id}`
                                                                                ]
                                                                                    ? "▼"
                                                                                    : "▶"
                                                                            }

                                                                            {" "}

                                                                            {competency.name}
                                                                        </div>

                                                                        {
                                                                            expandedAbilities[
                                                                                `${level.id}-${competency.id}`
                                                                            ] && (

                                                                                <div className="ml-4">

                                                                                    {competency.descriptors.map(
                                                                                        descriptor => (

                                                                                        <div key={descriptor.id}>

                                                                                            <div
                                                                                                className="tree-folder"
                                                                                                onClick={() =>
                                                                                                    setExpandedGrades(
                                                                                                        prev => ({
                                                                                                            ...prev,
                                                                                                            [
                                                                                                                `${level.id}-${competency.id}-${descriptor.grade}`
                                                                                                            ]:
                                                                                                                !prev[
                                                                                                                    `${level.id}-${competency.id}-${descriptor.grade}`
                                                                                                                ]
                                                                                                        })
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    expandedGrades[
                                                                                                        `${level.id}-${competency.id}-${descriptor.grade}`
                                                                                                    ]
                                                                                                        ? "▼"
                                                                                                        : "▶"
                                                                                                }

                                                                                                {" "}

                                                                                                Betyg {descriptor.grade}
                                                                                            </div>

                                                                                            {
                                                                                                expandedGrades[
                                                                                                    `${level.id}-${competency.id}-${descriptor.grade}`
                                                                                                ] && (

                                                                                                    <div
                                                                                                        className="
                                                                                                            ml-4
                                                                                                            tree-file
                                                                                                            whitespace-normal
                                                                                                        "
                                                                                                    >
                                                                                                        {
                                                                                                            descriptor.description
                                                                                                        }
                                                                                                    </div>

                                                                                                )
                                                                                            }

                                                                                        </div>

                                                                                    ))}
                                                                                </div>

                                                                            )
                                                                        }

                                                                    </div>

                                                                ))}

                                                            </div>
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

                <Button
                    className="tree-folder"
                    variant="ghost"
                    size="lg"
                    onClick={() => toggle("books")}
                    onContextMenu={(e) => {

                        if (user?.role !== "super") {
                            return;
                        }

                        e.preventDefault();

                        setContextMenu({
                            type: "books",
                            x: e.clientX,
                            y: e.clientY
                        });

                    }}
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
                                    onContextMenu={(e) => {

                                        if (user?.role !== "super") {
                                            return;
                                        }

                                        e.preventDefault();

                                        setContextMenu({
                                            type: "book",
                                            bookId: book.id,
                                            bookTitle: book.title,
                                            x: e.clientX,
                                            y: e.clientY
                                        });

                                    }}
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

                <Button
                    className="tree-folder"
                    variant="ghost"
                    size="lg"
                    onClick={() =>
                        toggle("abilities")
                    }
                    onContextMenu={(e) => {

                        e.preventDefault();

                        setContextMenu({
                            type: "abilities",
                            x: e.clientX,
                            y: e.clientY
                        });

                    }}
                                    >
                    {show.abilities ? "▼" : "▶"} Förmågor
                </Button>

                {show.abilities && (

                    <div className="ml-4">

                        {abilitySeries.map(series => (

                            <div key={series.id}>

                                <div
                                    className="tree-folder"
                                    onClick={() =>
                                        setExpandedAbilitySeries(
                                            prev => ({
                                                ...prev,
                                                [series.id]:
                                                    !prev[series.id]
                                            })
                                        )
                                    }
                                    onContextMenu={(e) => {

                                        const canEdit =
                                            user?.role === "super" ||
                                            series.permission === "owner" ||
                                            series.permission === "editor";

                                        const canManage =
                                            user?.role === "super" ||
                                            series.permission === "owner";

                                        if (!canEdit && !canManage) {
                                            return;
                                        }

                                        e.preventDefault();

                                        setContextMenu({
                                            type: "ability-series",
                                            seriesId: series.id,
                                            seriesName: series.name,
                                            permission: series.permission,
                                            visibility: series.visibility,
                                            x: e.clientX,
                                            y: e.clientY
                                        });

                                    }}
                                >


                                    {
                                        expandedAbilitySeries[
                                            series.id
                                        ]
                                            ? "▼"
                                            : "▶"
                                    }

                                    {" "}

                                    {series.name}

                                    {" "}

                                    <span className="text-muted-foreground text-xs">
                                        ({series.subject_name})
                                    </span>

                                    <span className="text-muted-foreground text-xs ml-2">
                                        (
                                        {series.visibility === "global" && "Global"}
                                        {series.visibility === "private" && "Privat"}
                                        {series.visibility === "school" && "Skola"}
                                        )
                                    </span>

                                </div>

                                {
                                    expandedAbilitySeries[
                                        series.id
                                    ] && (

                                        <div className="ml-4">

                                            {(series.abilities || [])
                                                .map(ability => (

                                                <AbilityTreeItem
                                                    key={ability.id}
                                                    ability={ability}
                                                    openTab={openTab}
                                                    hoverTarget={hoverTarget}
                                                    setContextMenu={
                                                        setContextMenu
                                                    }
                                                />

                                            ))}

                                        </div>

                                    )
                                }

                            </div>

                        ))}

                    </div>

                )}

                <div className="mt-6 border-t pt-2">

                    <div
                        className="tree-folder"
                        onClick={() =>
                            setArchiveOpen(
                                prev => !prev
                            )
                        }
                    >
                        <span>
                            {archiveOpen ? "▼" : "▶"}
                        </span>

                        <span>Arkiv</span>

                    </div>

                    {archiveOpen && (

                        <div className="ml-6">

                            <div
                                className="tree-file"
                                onClick={() =>
                                    openTab({
                                        id: "archived-groups",
                                        type: "archived-groups",
                                        title: "Grupper"
                                    })

                                }
                            >
                                Grupper
                            </div>

                            <div
                                className="tree-file"
                                onClick={() =>
                                    openTab({
                                        id: "archived-students",
                                        title: "Elever",
                                        type: "archived-students"
                                    })
                                }
                            >
                                Elever
                            </div>

                            <div
                                className="tree-file"
                                onClick={() =>
                                    openTab({
                                        id: "archived-exams",
                                        type: "archived-exams",
                                        title: "Prov"
                                    })
                                }
                            >
                                Prov
                            </div>

                            <div
                                className="tree-file"
                                onClick={() =>
                                    openTab({
                                        id: "archived-blocks",
                                        title: "Block",
                                        type: "archived-blocks"
                                    })
                                }
                            >
                                Block
                            </div>

                            <div
                                className="tree-file"
                                onClick={() =>
                                    openTab({
                                        id: "archived-questions",
                                        title: "Uppgifter",
                                        type: "archived-questions"
                                    })
                                }
                            >
                                Uppgifter
                            </div>

                        </div>

                    )}

                </div>

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

            <ImportStudentsDialog
                group={importStudentsDialog}
                open={!!importStudentsDialog}
                onOpenChange={() =>
                    setImportStudentsDialog(null)
                }
            />

            <CreateAbilityDialog
                open={!!createAbilityDialog}
                series={createAbilityDialog}
                onOpenChange={() =>
                    setCreateAbilityDialog(null)
                }
                onCreated={loadAbilitySeries}
            />
            <CreateAbilitiesFromExcelDialog
                open={!!importAbilitiesDialog}
                onOpenChange={() =>
                    setImportAbilitiesDialog(null)
                }
                seriesId={
                    importAbilitiesDialog?.seriesId
                }
                onCreated={loadAbilitySeries}
            />
            <RenameAbilityDialog
                open={!!renameAbilityDialog}
                onOpenChange={() =>
                    setRenameAbilityDialog(null)
                }
                ability={renameAbilityDialog}
                onRenamed={loadAbilitySeries}
            />

            <DeleteAbilityDialog
                open={!!deleteAbilityDialog}
                onOpenChange={() =>
                    setDeleteAbilityDialog(null)
                }
                ability={deleteAbilityDialog}
                onDeleted={loadAbilitySeries}
            />
            <CreateLessonSeriesDialog
                open={!!createLessonSeriesDialog}
                group={createLessonSeriesDialog}
                onOpenChange={() =>
                    setCreateLessonSeriesDialog(null)
                }
            />
            <ImportCriteriaDialog
                open={!!importCriteriaDialog}
                level={importCriteriaDialog}
                onOpenChange={() =>
                    setImportCriteriaDialog(null)
                }
                onImported={loadSubjects}
            />
            <ImportCentralContentDialog
                open={!!importCentralContentDialog}
                level={importCentralContentDialog}
                onOpenChange={() =>
                    setImportCentralContentDialog(null)
                }
                onImported={loadSubjects}
            />
            <CreateLevelDialog
                open={!!createLevelDialog}
                subject={createLevelDialog}
                onOpenChange={() =>
                    setCreateLevelDialog(null)
                }
                onCreated={loadSubjects}
            />
            <ImportBookStructureDialog
                open={!!importBookStructureDialog}
                book={importBookStructureDialog}
                onOpenChange={() =>
                    setImportBookStructureDialog(null)
                }
                onImported={loadBooks}
            />
            <CreateBookDialog
                open={createBookDialog}
                onOpenChange={setCreateBookDialog}
                subjects={subjects}
                onCreated={loadBooks}
            />
            <CreateAbilitySeriesDialog
                open={createAbilitySeriesDialog}
                onOpenChange={
                    setCreateAbilitySeriesDialog
                }
                subjects={subjects}
                onCreated={loadAbilitySeries}
            />
            <RenameAbilitySeriesDialog
                open={!!renameAbilitySeriesDialog}
                series={renameAbilitySeriesDialog}
                onOpenChange={() =>
                    setRenameAbilitySeriesDialog(null)
                }
                onRenamed={loadAbilitySeries}
            />
        </>
    )
}