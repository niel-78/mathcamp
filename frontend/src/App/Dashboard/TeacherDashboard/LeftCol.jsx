import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import UserProfile from "@/components/ui/UserProfile";
import SharePlanningDialog from "./LeftCol/SharePlanningDialog";

function TreeDisclosureIcon({ open }) {
    const Icon = open ? ChevronDown : ChevronRight;

    return <Icon className="mr-1 inline-block h-4 w-4" aria-hidden="true" />;
}
import CreateGroupDialog from "./LeftCol/CreateGroupDialog";
import RenameGroupDialog from "./LeftCol/RenameGroupDialog";
import GroupAbilitySeriesDialog from "./LeftCol/GroupAbilitySeriesDialog";
import GroupBookDialog from "./LeftCol/GroupBookDialog";
import ArchiveGroupDialog from "./LeftCol/ArchiveGroupDialog";
import CreateStudentDialog from "./LeftCol/CreateStudentDialog";
import EditStudentDialog from "./LeftCol/EditStudentDialog";
import ResetPasswordDialog from "./LeftCol/ResetPasswordDialog";
import ArchiveStudentDialog from "./LeftCol/ArchiveStudentDialog";
import ImportStudentsDialog from "./LeftCol/ImportStudentsDialog";
import ImportExistingStudentDialog from "./LeftCol/ImportExistingStudentDialog";
import CreateStaffDialog from "./LeftCol/CreateStaffDialog";
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
import RenameLevelDialog from "./LeftCol/RenameLevelDialog";
import ImportBookStructureDialog from "./LeftCol/ImportBookStructureDialog";
import CreateBookDialog from "./LeftCol/CreateBookDialog";
import CreateAbilitySeriesDialog from "./LeftCol/CreateAbilitySeriesDialog";
import RenameAbilitySeriesDialog from "./LeftCol/RenameAbilitySeriesDialog";
import DeleteAbilitySeriesDialog from "./LeftCol/DeleteAbilitySeriesDialog";
import ContextMenu from "./LeftCol/ContextMenu";
import CreateClassroomLayoutDialog from "./Main/CreateClassroomLayoutDialog";
import RenameClassroomDialog from "./Main/RenameClassroomDialog";
import DeleteClassroomDialog from "./Main/DeleteClassroomDialog";
import RenameLayoutDialog from "./Main/RenameLayoutDialog";
import DeleteLayoutDialog from "./Main/DeleteLayoutDialog";
import DuplicateLayoutDialog from "./Main/DuplicateLayoutDialog";
import CreateScheduleExceptionDialog from "./Main/CreateScheduleExceptionDialog";
import ImportScheduleExceptionsDialog from "./Main/ImportScheduleExceptionsDialog";
import DeleteScheduleExceptionDialog from "./Main/DeleteScheduleExceptionDialog";
import EditScheduleExceptionDialog from "./Main/EditScheduleExceptionDialog";
import CreateClassroomDialog from "./LeftCol/CreateClassroomDialog";
import PrintLoginDialog from "./Main/PrintLoginDialog";
import { scheduleExceptionLabels } from "@/constants/scheduleExceptionLabels";
import { getGroupColor, GROUP_COLORS } from "@/utils/groupColors";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function LeftCol( {openTab, hoverTarget} ) {

    const [groups, setGroups] = useState([]);
    const [show, setShow] = useState({
        groups: false,
        subjects: false,
        assessments: false,
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
    const [abilitySeriesDialog, setAbilitySeriesDialog] = useState(null);
    const [groupBookDialog, setGroupBookDialog] = useState(null);
    const [archiveDialog, setArchiveDialog] = useState(null);
    const [groupStudents, setGroupStudents] = useState({});
    const [expandedStudents, setExpandedStudents] = useState({});
    const [createStudentDialog, setCreateStudentDialog] = useState(null);
    const [passwordDialog, setPasswordDialog] = useState(null);
        const [staffPasswordDialog, setStaffPasswordDialog] = useState(null);
    const [renameStudentDialog, setRenameStudentDialog] = useState(null);
    const [archiveStudentDialog, setArchiveStudentDialog] = useState(null);
    const [books, setBooks] = useState([]);
    const [expandedBooks, setExpandedBooks] = useState({});
    const [expandedChapters, setExpandedChapters] = useState({});
    const [expandedSubchapters, setExpandedSubchapters] = useState({});
    const [abilitySeries, setAbilitySeries] = useState([]);
    const [expandedAbilitySeries, setExpandedAbilitySeries] = useState({});
    const [importStudentsDialog,setImportStudentsDialog] = useState(null);
    const [importExistingStudentDialog, setImportExistingStudentDialog] = useState(null);
    const [createAbilityDialog, setCreateAbilityDialog] = useState(null);
    const [importAbilitiesDialog, setImportAbilitiesDialog] = useState(null);
    const [renameAbilityDialog, setRenameAbilityDialog] = useState(null);
    const [deleteAbilityDialog, setDeleteAbilityDialog] = useState(null);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [trashOpen, setTrashOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [assessmentSettingsOpen, setAssessmentSettingsOpen] = useState(false);
    const [createLessonSeriesDialog, setCreateLessonSeriesDialog] = useState(null);
    const [expandedBookSections, setExpandedBookSections] = useState({});
    const [expandedBookAbilities, setExpandedBookAbilities] = useState({});
    const [expandedCompetencies, setExpandedCompetencies] = useState({});
    const [expandedGrades,setExpandedGrades] = useState({});
    const [importCriteriaDialog,setImportCriteriaDialog] = useState(null);
    const [importCentralContentDialog, setImportCentralContentDialog] = useState(null);
    const [createLevelDialog, setCreateLevelDialog] = useState(null);
    const [renameLevelDialog, setRenameLevelDialog] = useState(null);
    const [importBookStructureDialog, setImportBookStructureDialog] = useState(null);
    const [createBookDialog, setCreateBookDialog] = useState(null);
    const [createAbilitySeriesDialog, setCreateAbilitySeriesDialog] = useState(false);
    const [renameAbilitySeriesDialog, setRenameAbilitySeriesDialog] = useState(null);
    const [expandedAbilities, setExpandedAbilities] = useState({});
    const [expandedClassrooms, setExpandedClassrooms] = useState({});
    const [classrooms, setClassrooms] = useState([]);
    const [expandedGroupClassrooms,setExpandedGroupClassrooms] = useState({});
    const [createLayoutDialogOpen, setCreateLayoutDialogOpen] = useState(false);
    const [selectedClassroomId, setSelectedClassroomId] = useState(null);
    const [renameClassroomDialog, setRenameClassroomDialog] = useState(null);
    const [deleteClassroomDialog, setDeleteClassroomDialog] = useState(null);
    const [renameLayoutDialog, setRenameLayoutDialog] = useState(null);
    const [deleteLayoutDialog, setDeleteLayoutDialog] = useState(null);
    const [duplicateLayoutDialog, setDuplicateLayoutDialog] = useState(null);
    const [groupClassrooms, setGroupClassrooms] = useState({});
    const [selectedSchoolId, setSelectedSchoolId] = useState(null);
    const [deleteAbilitySeriesDialog, setDeleteAbilitySeriesDialog] = useState(null);
    const [schools, setSchools] = useState([]);
    const [expandedGroupClassroomItems,setExpandedGroupClassroomItems] = useState({});
    const [groupScheduleExceptions, setGroupScheduleExceptions] = useState({})
    const [expandedSchoolScheduleExceptions, setExpandedSchoolScheduleExceptions] = useState({});
    const [createScheduleExceptionDialog, setCreateScheduleExceptionDialog] = useState(null);
    const [deleteScheduleExceptionDialog, setDeleteScheduleExceptionDialog] = useState(null);
    const [editScheduleExceptionDialog, setEditScheduleExceptionDialog] = useState(null);
    const [importScheduleExceptionsDialog,setImportScheduleExceptionsDialog] = useState(null);
    const [createClassroomDialogOpen, setCreateClassroomDialogOpen] = useState(false);
    const [sharePlanningDialog, setSharePlanningDialog] = useState(null);
    const [printLoginsGroup, setPrintLoginsGroup] = useState(null);
    const [schoolStaff, setSchoolStaff] = useState({});
    const [expandedSchoolStaff, setExpandedSchoolStaff] = useState({});
    const [schoolStudents, setSchoolStudents] = useState({});
    const [expandedSchoolStudents, setExpandedSchoolStudents] = useState({});
    const [createStaffOpen, setCreateStaffOpen] = useState(false);
    const [selectedSchoolForStaff, setSelectedSchoolForStaff] = useState(null);

    const [showSchools, setShowSchools] =
        useState(false);

    const [expandedSchools, setExpandedSchools] =
        useState({});

    const [
        expandedSchoolClassrooms,
        setExpandedSchoolClassrooms
    ] = useState({});

    const canManageSchool = (school) => {

        const valueIsTrue = (value) =>
            value === true ||
            value === 1 ||
            value === "1";

        if (user?.role === "super") {
            return true;
        }

        if (valueIsTrue(school?.is_admin)) {
            return true;
        }

        return (
            valueIsTrue(user?.school?.is_admin) &&
            Number(user?.school?.id) === Number(school?.id)
        );

    };

    useEffect(() => {
        loadGroups();
        loadSubjects();
        loadBooks();
        loadSchools();
        loadAbilitySeries();
        loadClassrooms();
    }, []);

    // Lyssna efter när personal skapas för att uppdatera listan automatiskt
    useEffect(() => {
        const handleStaffCreated = (e) => {
            const { schoolId } = e.detail;
            loadSchoolStaff(schoolId);
        };

        window.addEventListener("staff-created", handleStaffCreated);
        return () => window.removeEventListener("staff-created", handleStaffCreated);
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

    useEffect(() => {

        const handleGroupScheduleCreated =
            async (event) => {

                await loadGroupClassrooms(
                    event.detail.groupId
                );

            };

        window.addEventListener(
            "group-schedule-created",
            handleGroupScheduleCreated
        );

        return () => {

            window.removeEventListener(
                "group-schedule-created",
                handleGroupScheduleCreated
            );

        };

    }, []);

    useEffect(() => {

        const handlePlanningQueueSaved =
            async () => {

                await loadGroups();

            };

        window.addEventListener(
            "planning-queue-saved",
            handlePlanningQueueSaved
        );

        return () => {

            window.removeEventListener(
                "planning-queue-saved",
                handlePlanningQueueSaved
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

    const updateGroupColor = async (groupId, colorIndex) => {

        setGroups(prev =>
            prev.map(group =>
                group.id === groupId
                    ? { ...group, color_index: colorIndex }
                    : group
            )
        );

        const response = await fetch(
            `${API_URL}/api/groups/${groupId}/color`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ color_index: colorIndex })
            }
        );

        if (!response.ok) {
            loadGroups();
            return;
        }

        window.dispatchEvent(
            new Event("group-color-changed")
        );

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

        };

    const loadSchools = async () => {

        const response =
            await fetch(
                `${API_URL}/api/schools`,
                {
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (
            canManageSchool(user?.school) &&
            user?.school?.id &&
            !data.some(
                school =>
                    Number(school.id) ===
                    Number(user.school.id)
            )
        ) {

            setSchools([
                {
                    id: user.school.id,
                    name: user.school.name,
                    is_admin: user.school.is_admin
                },
                ...data
            ]);

            return;

        }

        setSchools(data);

    };

    const loadClassrooms = async () => {

        const response = await fetch(
            `${API_URL}/api/classrooms`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        setClassrooms(data);

    };

    const loadGroupClassrooms = async (
        groupId
    ) => {

        const response =
            await fetch(
                `${API_URL}/api/groups/${groupId}/classrooms`,
                {
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();
        setGroupClassrooms(prev => ({
            ...prev,
            [groupId]: data
        }));

    };

    const loadSchoolStaff = async (schoolId) => {
        const response = await fetch(
            `${API_URL}/api/schools/${schoolId}/staff`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        setSchoolStaff(prev => ({
            ...prev,
            [schoolId]: data
        }));
    };

    const toggleSchoolStaff = async (schoolId) => {
        if (!schoolStaff[schoolId]) {
            await loadSchoolStaff(schoolId);
        }
        setExpandedSchoolStaff(prev => ({
            ...prev,
            [schoolId]: !prev[schoolId]
        }));
    };

    const loadSchoolStudents = async (schoolId) => {
        const response = await fetch(
            `${API_URL}/api/schools/${schoolId}/students`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        setSchoolStudents(prev => ({
            ...prev,
            [schoolId]: data
        }));
    };

    const toggleSchoolStudents = async (schoolId) => {
        if (!schoolStudents[schoolId]) {
            await loadSchoolStudents(schoolId);
        }

        setExpandedSchoolStudents(prev => ({
            ...prev,
            [schoolId]: !prev[schoolId]
        }));
    };

    const selectLayout = async (
        layout
    ) => {

        setSelectedLayout(layout);

        const res =
            await api.get(
                `/classroom-layouts/${layout.id}/seats`
            );

        setSeats(res.data);

    };

    const loadSchoolScheduleExceptions =
        async (schoolId) => {

            const response =
                await fetch(
                    `${API_URL}/api/group-schedules/school/${schoolId}/exceptions`,
                    {
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setGroupScheduleExceptions(
                previous => ({
                    ...previous,
                    [schoolId]: data
                })
            );
        };

    const toggle = (name) => {
        setShow(prev => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const toggleFolder = async (groupId) => {

        if (!groupClassrooms[groupId]) {

            await loadGroupClassrooms(
                groupId
            );

        }

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

    const toggleSchool =
        (schoolId) => {

            setExpandedSchools(
                previous => ({
                    ...previous,
                    [schoolId]: !previous[schoolId]
                })
            );

        };

    const toggleSchoolClassrooms =
        (schoolId) => {

            setExpandedSchoolClassrooms(
                previous => ({
                    ...previous,
                    [schoolId]: !previous[schoolId]
                })
            );

        };

        const toggleClassroom = async (
            classroomId
        ) => {

            const expanded =
                expandedClassrooms[classroomId];

            setExpandedClassrooms(prev => ({
                ...prev,
                [classroomId]: !prev[classroomId]
            }));

            if (!expanded) {

                const response =
                    await fetch(
                        `${API_URL}/api/classrooms/${classroomId}/layouts`,
                        {
                            headers: authHeaders()
                        }
                    );

                if (!response.ok) {
                    console.error(
                        "Kunde inte hämta layouts",
                        response.status
                    );
                    return;
                }

                const layouts =
                    await response.json();

                setClassrooms(prev =>
                    prev.map(classroom =>
                        classroom.id === classroomId
                            ? {
                                ...classroom,
                                layouts
                            }
                            : classroom
                    )
                );
            }
        };

    const toggleSchoolScheduleExceptions =
        async (schoolId) => {

            if (
                !groupScheduleExceptions[schoolId]
            ) {
                await loadSchoolScheduleExceptions(
                    schoolId
                );
            }

            setExpandedSchoolScheduleExceptions(
                previous => ({
                    ...previous,
                    [schoolId]: !previous[schoolId]
                })
            );

        };

    const downloadScheduleExceptionTemplate = () => {

        const csv = [
            "Datum,Typ,Anteckning",
            "2026-10-26,study_day,Studiedag",
            "2026-12-24,holiday,Julafton",
            "2027-01-08,other,Temadag"
        ].join("\n");

        const blob = new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "schemabrytande-dagar-mall.csv";

        link.click();

        URL.revokeObjectURL(url);
    };

    const downloadBookSectionsTemplate =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/books/import-sections-template`,
                    {
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const blob =
                await response.blob();

            const url =
                URL.createObjectURL(blob);

            const a =
                document.createElement("a");

            a.href = url;
            a.download =
                "bokstruktur-mall.xlsx";

            document.body.appendChild(a);

            a.click();

            a.remove();

            URL.revokeObjectURL(url);
        };

    const downloadAbilityTemplate =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/abilities/import-template`,
                    {
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const blob =
                await response.blob();

            const url =
                URL.createObjectURL(blob);

            const a =
                document.createElement("a");

            a.href = url;
            a.download =
                "formagor-mall.xlsx";

            a.click();

            URL.revokeObjectURL(url);
        };

    const downloadCriteriaTemplate =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/levels/criteria-template`,
                    {
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const blob =
                await response.blob();

            const url =
                URL.createObjectURL(blob);

            const a =
                document.createElement("a");

            a.href = url;
            a.download =
                "kriterier-mall.xlsx";

            a.click();

            URL.revokeObjectURL(url);
        };

    const downloadCentralContentTemplate =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/levels/central-content-template`,
                    {
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {
                return;
            }

            const blob =
                await response.blob();

            const url =
                URL.createObjectURL(blob);

            const a =
                document.createElement("a");

            a.href = url;
            a.download =
                "centralt-innehall-mall.xlsx";

            a.click();

            URL.revokeObjectURL(url);
        };

    return (
        <>
            <UserProfile />




            <ContextMenu
                contextMenu={contextMenu}
                setContextMenu={setContextMenu}
                user={user}
                openTab={openTab}
                onCreateGroup={() => {
                    setShowCreateGroupDialog(true);
                }}

                onRenameGroup={(groupId, groupName) => {
                    setRenameDialog({
                        id: groupId,
                        name: groupName
                    });
                }}

                onSetGroupAbilitySeries={(groupId, groupName, abilitySeriesId) => {
                    setAbilitySeriesDialog({
                        id: groupId,
                        name: groupName,
                        abilitySeriesId
                    });
                }}

                onSetGroupBook={(groupId, groupName, bookId) => {
                    setGroupBookDialog({
                        id: groupId,
                        name: groupName,
                        bookId
                    });
                }}

                onSharePlanning={(groupId, groupName) => {
                    setSharePlanningDialog({
                        groupId,
                        groupName
                    });
                }}

                onArchiveGroup={(groupId, groupName) => {
                    setArchiveDialog({
                        id: groupId,
                        name: groupName
                    });
                }}
                onCreateStudent={(groupId, groupName) => {
                    setCreateStudentDialog({
                        groupId,
                        groupName
                    });
                }}

                onImportStudents={(groupId, groupName) => {
                    setImportStudentsDialog({
                        groupId,
                        groupName
                    });
                }}

                onImportExistingStudent={(groupId, groupName) => {
                    const group = groups.find(
                        item => Number(item.id) === Number(groupId)
                    );

                    setImportExistingStudentDialog({
                        groupId,
                        groupName,
                        schoolId: group?.school_id
                    });
                }}
                onPrintLogins={(
                    groupId,
                    groupName
                        ) => {
                    setPrintLoginsGroup({
                        groupId,
                        groupName
                    });
                }}
                onResetPassword={(userId, name) => {
                    setPasswordDialog({
                        userId,
                        name
                    });
                }}
                onResetStaffPassword={(userId, name, schoolId) => {
                    setStaffPasswordDialog({
                        userId,
                        name,
                        schoolId,
                    });
                }}

                onRenameStudent={(student) => {
                    setRenameStudentDialog(student);
                }}

                onArchiveStudent={(student) => {
                    setArchiveStudentDialog(student);
                }}

                onCreateLessons={(groupId, groupName) => {
                    setCreateLessonSeriesDialog({
                        groupId,
                        groupName
                    });
                }}

                onManageSchedule={(groupId, groupName) => {
                    openTab({
                        id: `group-schedules-${groupId}`,
                        type: "group-schedules",
                        title: `${groupName} - Schema`,
                        groupId
                    });
                }}

                onOpenQueue={(groupId, groupName) => {
                    openTab({
                        id: `planning-queue-${groupId}`,
                        type: "planning-queue",
                        title: `${groupName} - Planeringskö`,
                        groupId
                    });
                }}

                onCreateLevel={(subjectId, subjectName) => {
                    setCreateLevelDialog({
                        subjectId,
                        subjectName
                    });
                }}

                onRenameLevel={(levelId, levelName) => {
                    setRenameLevelDialog({
                        id: levelId,
                        name: levelName
                    });
                }}

                onCreateBook={(levelId, levelName) => {
                    setCreateBookDialog({
                        levelId,
                        levelName
                    });
                }}

                onImportCriteria={(levelId, levelName) => {
                    setImportCriteriaDialog({
                        levelId,
                        levelName
                    });
                }}

                onImportCentralContent={(levelId, levelName) => {
                    setImportCentralContentDialog({
                        levelId,
                        levelName
                    });
                }}
                onDownloadCentralContentTemplate={
                    downloadCentralContentTemplate
                }
                onDownloadCriteriaTemplate={
                    downloadCriteriaTemplate
                }
                onCreateBookRoot={() => {
                    setCreateBookDialog(true);
                }}
                onDownloadBookSectionsTemplate={
                    downloadBookSectionsTemplate
                }
                onImportBookStructure={(bookId, bookTitle) => {
                    setImportBookStructureDialog({
                        bookId,
                        bookTitle
                    });
                }}
                onOpenBookPlanningQueue={(bookId, bookTitle) => {
                    openTab({
                        id: `book-planning-queue-${bookId}`,
                        type: "book-planning-queue",
                        title: `${bookTitle} - Planeringskö`,
                        bookId,
                        bookTitle
                    });
                }}


                onCreateAbilitySeries={() => {
                    setCreateAbilitySeriesDialog(true);
                }}

                onCreateAbility={(seriesId, seriesName) => {
                    setCreateAbilityDialog({
                        id: seriesId,
                        name: seriesName
                    });
                }}
                onImportAbilities={(seriesId, seriesName) => {
                    setImportAbilitiesDialog({
                        seriesId,
                        seriesName
                    });
                }}

                onRenameAbilitySeries={(seriesId, seriesName) => {
                    setRenameAbilitySeriesDialog({
                        id: seriesId,
                        name: seriesName
                    });
                }}

                onDeleteAbilitySeries={(seriesId, seriesName) => {
                    setDeleteAbilitySeriesDialog({
                        id: seriesId,
                        name: seriesName
                    });
                }}

                onRenameAbility={(id, name) => {
                    setRenameAbilityDialog({
                        id,
                        name
                    });
                }}
                onDownloadAbilityTemplate={
                    downloadAbilityTemplate
                }
                onDeleteAbility={(id, name) => {
                    setDeleteAbilityDialog({
                        id,
                        name
                    });
                }}
                onCreateScheduleException={(
                    schoolId,
                    schoolName
                ) => {

                    setCreateScheduleExceptionDialog({
                        schoolId,
                        schoolName
                    });

                }}
                onEditScheduleException={(exception) => {

                    setEditScheduleExceptionDialog(
                        exception
                    );

                }}
                onImportScheduleExceptions={(
                    schoolId,
                    schoolName
                ) => {

                    setImportScheduleExceptionsDialog({
                        schoolId,
                        schoolName
                    });

                }}
                onDownloadScheduleExceptionTemplate={
                    downloadScheduleExceptionTemplate
                }
                onDeleteScheduleException={(
                    exceptionId,
                    schoolId
                ) => {

                    setDeleteScheduleExceptionDialog({
                        exceptionId,
                        schoolId
                    });

                }}
                onCreateClassroom={(schoolId) => {
                    setSelectedSchoolId(schoolId);
                    setCreateClassroomDialogOpen(true);
                }}
                onCreateStaff={(schoolId, schoolName) => {
                        setSelectedSchoolForStaff({ schoolId, schoolName });
                        setCreateStaffOpen(true);
                    }}

                setRenameDialog={setRenameDialog}
                setArchiveDialog={setArchiveDialog}

                setSelectedClassroomId={setSelectedClassroomId}
                setCreateClassroomDialogOpen={setCreateClassroomDialogOpen}
                setCreateLayoutDialogOpen={setCreateLayoutDialogOpen}
                setRenameClassroomDialog={setRenameClassroomDialog}
                setDeleteClassroomDialog={setDeleteClassroomDialog}
                setRenameLayoutDialog={setRenameLayoutDialog}
                setDuplicateLayoutDialog={setDuplicateLayoutDialog}
                setDeleteLayoutDialog={setDeleteLayoutDialog}
                setSelectedSchoolId={setSelectedSchoolId}
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
                    <TreeDisclosureIcon open={show.groups} /> Grupper
                </Button>

                {show.groups && (
                    <ul>

                        {groups.map(group => (

                            <li
                                key={group.id}
                            >

                                <div className="flex items-center gap-1">

                                    <Button
                                        className="tree-node ml-4 flex-1 justify-start"
                                        variant="ghost"
                                        onClick={() => {
                                            toggleFolder(group.id);
                                            openTab({
                                                id: `group-info-${group.id}`,
                                                type: "group-info",
                                                title: group.name,
                                                groupId: group.id
                                            });
                                        }}
                                        onContextMenu={(e) => {

                                            e.preventDefault();

                                            setContextMenu({
                                                type: "group",
                                                groupId: group.id,
                                                groupName: group.name,
                                                groupBookId: group.book_id,
                                                groupAbilitySeriesId: group.ability_series_id,
                                                x: e.clientX,
                                                y: e.clientY
                                            });

                                        }}
                                    >
                                        <TreeDisclosureIcon open={expandedGroups[group.id]} />

                                        {group.name}
                                    </Button>

                                    <DropdownMenu>

                                    <DropdownMenuTrigger
                                        title="Byt gruppens f\u00e4rg"
                                        className="
                                            mr-2
                                            inline-flex
                                            h-4
                                            w-4
                                            shrink-0
                                            rounded-full
                                            border
                                        "
                                        style={{
                                            backgroundColor:
                                                getGroupColor(group.id, group.color_index)?.background,
                                            borderColor:
                                                getGroupColor(group.id, group.color_index)?.border
                                        }}
                                    />

                                    <DropdownMenuContent>

                                        {GROUP_COLORS.map((color, index) => (

                                            <DropdownMenuItem
                                                key={index}
                                                onClick={() =>
                                                    updateGroupColor(group.id, index)
                                                }
                                            >
                                                <span
                                                    className="inline-flex h-4 w-4 shrink-0 rounded-full border"
                                                    style={{
                                                        backgroundColor: color.background,
                                                        borderColor: color.border
                                                    }}
                                                />
                                                {group.color_index === index && "Vald f\u00e4rg"}
                                            </DropdownMenuItem>

                                        ))}

                                    </DropdownMenuContent>

                                    </DropdownMenu>

                                </div>

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
                                                    bookId: group.book_id,
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
                                                    <TreeDisclosureIcon open={expandedBookSections[group.id]} /> Sektioner
                                                </div>

                                                {expandedBookSections[group.id] && (
                                                    <div className="ml-4">

                                                        {(group.sections || []).map(section => (

                                                            <SectionTreeItem
                                                                key={section.id}
                                                                section={section}
                                                                openTab={openTab}
                                                                groupId={group.id}
                                                                groupName={group.name}
                                                                groupAbilitySeriesId={
                                                                    group.ability_series_id
                                                                }
                                                                hoverTarget={hoverTarget}
                                                                inPlanningQueue={
                                                                    (group.planningSectionIds || [])
                                                                        .includes(section.id)
                                                                }
                                                            />

                                                        ))}

                                                    </div>
                                                )}

                                                <div
                                                    className="tree-file cursor-pointer"
                                                    onClick={() => toggleBookAbilities(group.id,group.book_id)}
                                                >
                                                    <TreeDisclosureIcon open={expandedBookAbilities[group.id]} /> Förmågor
                                                </div>

                                                {expandedBookAbilities[group.id] && (
                                                    <div className="ml-4">

                                                        {(group.abilities || []).map(ability => (

                                                            <div
                                                                key={ability.id}
                                                                className="tree-folder"
                                                                onClick={() =>
                                                                    setExpandedAbilities(prev => ({
                                                                        ...prev,
                                                                        [ability.id]: !prev[ability.id]
                                                                    }))
                                                                }
                                                            >
                                                                <TreeDisclosureIcon open={expandedAbilities[ability.id]} />
                                                                {ability.name}
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
                                            <TreeDisclosureIcon open={expandedStudents[group.id]} />
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
                                                                        studentId: student.id,
                                                                        groupId: group.id
                                                                    })
                                                                }
                                                                onContextMenu={(e) => {

                                                                    e.preventDefault();

                                                                    setContextMenu({
                                                                        type: "student",
                                                                        userId: student.id,
                                                                        firstName: student.first_name,
                                                                        lastName: student.last_name,
                                                                        displayName: student.display_name,
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

                                        <div
                                            className="tree-file cursor-pointer"
                                            onClick={() =>
                                                setExpandedGroupClassrooms(prev => ({
                                                    ...prev,
                                                    [group.id]: !prev[group.id]
                                                }))
                                            }
                                        >
                                            <TreeDisclosureIcon open={expandedGroupClassrooms[group.id]} />
                                            Klassrum
                                        </div>

                                        {expandedGroupClassrooms[group.id] && (

                                            <div className="ml-4">

                                                {(groupClassrooms[group.id] || []).map(
                                                    classroom => (

                                                        <div key={classroom.id}>

                                                            <div
                                                                className="tree-folder cursor-pointer"
                                                                onClick={() =>
                                                                    setExpandedGroupClassroomItems(prev => ({
                                                                        ...prev,
                                                                        [classroom.id]:
                                                                            !prev[classroom.id]
                                                                    }))
                                                                }
                                                            >
                                                                <TreeDisclosureIcon
                                                                    open={expandedGroupClassroomItems[classroom.id]}
                                                                />

                                                                {classroom.name}
                                                            </div>

                                                            {
                                                                expandedGroupClassroomItems[
                                                                classroom.id
                                                            ] && (

                                                                <div className="ml-4">

                                                                    {(classroom.layouts || []).map(
                                                                        layout => (

                                                                            <div
                                                                                key={layout.id}
                                                                                className="
                                                                                    tree-file
                                                                                    cursor-pointer
                                                                                "
                                                                                onClick={() =>
                                                                                    openTab({
                                                                                        id:
                                                                                            `group-layout-${group.id}-${layout.id}`,
                                                                                        type:
                                                                                            "group-layout",
                                                                                        title:
                                                                                            `${group.name} - ${layout.name}`,
                                                                                        groupId:
                                                                                            group.id,
                                                                                        layoutId:
                                                                                            layout.id
                                                                                    })
                                                                                }
                                                                            >
                                                                                {layout.name}
                                                                            </div>

                                                                        )
                                                                    )}

                                                                </div>
                                                            
                                                            )}

                                                        </div>

                                                    )
                                                )}

                                            </div>
                                            
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-sm"
                                            onClick={() => {
                                            openTab({
                                                id: `group-addons-${group.id}`,
                                                type: "group-addons",
                                                title: `${group.name} - Tillval`,
                                                groupId: group.id
                                            });
                                            }}
                                        >
                                            Tillval
                                        </Button>    


                                        {/* <div className="tree-file">
                                            Inställningar
                                        </div> */}
                                    </div>
                                )}

                            </li>

                        ))}

                    </ul>
                )}

                <Button className="tree-folder"
                        variant="ghost"
                        size="lg"
                        onClick={() => toggle("assessments")}
                >
                    <TreeDisclosureIcon open={show.assessments} /> Prov
                </Button>


                <Button className="tree-folder" 
                    variant="ghost"
                    size="lg"
                    onClick={() =>
                        toggle("subjects")
                    }
                >
                    <TreeDisclosureIcon open={show.subjects} /> Ämnen
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
                                    <TreeDisclosureIcon open={expandedSubjects[subject.id]} />
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
                                                    onContextMenu={(e) => {
                                                        if (user?.role !== "super") {
                                                            return;
                                                        }

                                                        e.preventDefault();

                                                        setContextMenu({
                                                            type: "level",
                                                            levelId: level.id,
                                                            levelName: level.name,
                                                            x: e.clientX,
                                                            y: e.clientY
                                                        });
                                                    }}
                                                >
                                                    <TreeDisclosureIcon open={expandedLevels[level.id]} />
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
                                                            <TreeDisclosureIcon
                                                                open={expandedAreas[`content-${level.id}`]}
                                                            />
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
                                                                                <TreeDisclosureIcon open={expandedAreas[area.id]} />
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
                                                            <TreeDisclosureIcon open={expandedCompetencies[level.id]} />

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
                                                                            <TreeDisclosureIcon
                                                                                open={expandedAbilities[`${level.id}-${competency.id}`]}
                                                                            />

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
                                                                                                <TreeDisclosureIcon
                                                                                                    open={expandedGrades[`${level.id}-${competency.id}-${descriptor.grade}`]}
                                                                                                />

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
                    <TreeDisclosureIcon open={show.books} /> Böcker
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
                                    <TreeDisclosureIcon open={expandedBooks[book.id]} />

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
                                                    <TreeDisclosureIcon open={expandedChapters[chapter.id]} />

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
                                                                        <TreeDisclosureIcon
                                                                            open={expandedSubchapters[subchapter.id]}
                                                                        />

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
                    <TreeDisclosureIcon open={show.abilities} /> Förmågor
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


                                    <TreeDisclosureIcon
                                        open={expandedAbilitySeries[series.id]}
                                    />

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

                <Button
                    className="tree-folder"
                    variant="ghost"
                    size="lg"
                    onClick={() =>
                        setShowSchools(prev => !prev)
                    }
                >
                    <TreeDisclosureIcon open={showSchools} /> Skolor
                </Button>

                {showSchools && (
                    <div className="ml-4">
                        {schools.map(school => (
                            <div key={school.id}>
                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        toggleSchool(school.id)
                                    }
                                >
                                    <TreeDisclosureIcon open={expandedSchools[school.id]} />
                                    {school.name}
                                </Button>

                                {expandedSchools[school.id] && (
                                    <div className="ml-4">

                                        <div
                                            className="tree-folder"
                                            onClick={() =>
                                                toggleSchoolClassrooms(
                                                    school.id
                                                )
                                            }
                                            onContextMenu={(e) => {

                                                if (!canManageSchool(school)) {
                                                    return;
                                                }

                                                e.preventDefault();

                                                setContextMenu({
                                                    type: "classrooms",
                                                    schoolId: school.id,
                                                    schoolName: school.name,
                                                    x: e.clientX,
                                                    y: e.clientY
                                                });
                                            }}
                                                                            >
                                            <TreeDisclosureIcon
                                                open={expandedSchoolClassrooms[school.id]}
                                            />

                                            Klassrum
                                        </div>
                                        
                                        {/* NYTT: Personal-lista */}
                                        {canManageSchool(school) && (
                                            <div>
                                                <div
                                                    className="tree-folder"
                                                    onClick={() => toggleSchoolStaff(school.id)}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setContextMenu({
                                                            type: "staff",
                                                            schoolId: school.id,
                                                            schoolName: school.name,
                                                            x: e.clientX,
                                                            y: e.clientY
                                                        });
                                                    }}
                                                >
                                                    <TreeDisclosureIcon open={expandedSchoolStaff[school.id]} /> Personal
                                                </div>

                                                {expandedSchoolStaff[school.id] && (
                                                    <div className="ml-4">

                                                        {(schoolStaff[school.id] || []).map(staffMember => (
                                                            <div
                                                                key={staffMember.id}
                                                                className="tree-file cursor-pointer"
                                                                onContextMenu={(e) => {
                                                                    e.preventDefault();
                                                                    setContextMenu({
                                                                        type: "staff-member",
                                                                        schoolId: school.id,
                                                                        schoolName: school.name,
                                                                        staffId: staffMember.id,
                                                                        firstName: staffMember.first_name,
                                                                        lastName: staffMember.last_name,
                                                                        userName: staffMember.username,
                                                                        staffName: `${staffMember.first_name} ${staffMember.last_name}`,
                                                                        x: e.clientX,
                                                                        y: e.clientY
                                                                    });
                                                                }}
                                                            >
                                                                {staffMember.first_name} {staffMember.last_name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {canManageSchool(school) && (
                                            <div>
                                                <div
                                                    className="tree-folder"
                                                    onClick={() =>
                                                        toggleSchoolStudents(
                                                            school.id
                                                        )
                                                    }
                                                >
                                                    <TreeDisclosureIcon
                                                        open={expandedSchoolStudents[school.id]}
                                                    /> Elever
                                                </div>

                                                {expandedSchoolStudents[
                                                    school.id
                                                ] && (
                                                    <div className="ml-4">
                                                        {(schoolStudents[
                                                            school.id
                                                        ] || []).map(student => (
                                                            <div
                                                                key={student.id}
                                                                className="tree-file cursor-pointer"
                                                                onClick={() =>
                                                                    openTab({
                                                                        id: `student-profile-${student.id}`,
                                                                        type: "student-profile",
                                                                        title: `${student.first_name} ${student.last_name}`,
                                                                        student: student
                                                                    })
                                                                }
                                                            >
                                                                {student.first_name} {student.last_name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {expandedSchoolClassrooms[
                                            school.id
                                        ] && (
                                            <div className="ml-4">

                                                {classrooms
                                                    .filter(
                                                        classroom =>
                                                            classroom.school_id ===
                                                            school.id
                                                    )
                                                    .map(classroom => (
                                                        <div
                                                            key={classroom.id}
                                                        >

                                                        <div
                                                            className="tree-folder"
                                                            onClick={() =>
                                                                setExpandedGroupClassrooms(prev => ({
                                                                    ...prev,
                                                                    [classroom.id]:
                                                                        !prev[classroom.id]
                                                                }))
                                                            }
                                                            onContextMenu={(e) => {
                                                                e.preventDefault();

                                                                setContextMenu({
                                                                    type: "classroom",
                                                                    canManage: canManageSchool(school),
                                                                    classroomId:
                                                                        classroom.id,
                                                                    schoolId: school.id,
                                                                    classroomName:
                                                                        classroom.name,
                                                                    x: e.clientX,
                                                                    y: e.clientY
                                                                });
                                                            }}
                                                        >
                                                            <TreeDisclosureIcon
                                                                open={expandedGroupClassrooms[classroom.id]}
                                                            />

                                                            {classroom.name}
                                                        </div>

                                                            {expandedGroupClassrooms[
                                                                classroom.id
                                                            ] && (

                                                                <div className="ml-4">

                                                                    {(classroom.layouts || [])
                                                                        .map(layout => (

                                                                            <div
                                                                                key={layout.id}
                                                                                className="
                                                                                    tree-file
                                                                                    cursor-pointer
                                                                                "
                                                                                onClick={() =>
                                                                                    openTab({
                                                                                        id:
                                                                                            `classroom-layout-${layout.id}`,
                                                                                        type:
                                                                                            "classroom-layout",
                                                                                        title:
                                                                                            layout.name,
                                                                                        layoutId:
                                                                                            layout.id
                                                                                    })
                                                                                }
                                                                                onContextMenu={(e) => {
                                                                                    e.preventDefault();

                                                                                    setContextMenu({
                                                                                        type:
                                                                                            "classroom-layout",
                                                                                        layoutId:
                                                                                            layout.id,
                                                                                        layoutName:
                                                                                            layout.name,
                                                                                        x: e.clientX,
                                                                                        y: e.clientY
                                                                                    });
                                                                                }}
                                                                            >
                                                                                {layout.name}
                                                                            </div>

                                                                        ))}

                                                                </div>

                                                            )}

                                                        </div>
                                                    ))}

                                            </div>
                                        )}

                                        <div
                                            className="tree-folder"
                                            onClick={() =>
                                                toggleSchoolScheduleExceptions(
                                                    school.id
                                                )
                                            }
                                            onContextMenu={(e) => {

                                                e.preventDefault();

                                                setContextMenu({
                                                    type: "schedule-exceptions",
                                                    schoolId: school.id,
                                                    schoolName: school.name,
                                                    x: e.clientX,
                                                    y: e.clientY
                                                });

                                            }}
                                        >
                                            <TreeDisclosureIcon
                                                open={expandedSchoolScheduleExceptions[school.id]}
                                            />

                                            Schemabrytande dagar
                                        </div>

                                        {expandedSchoolScheduleExceptions[
                                            school.id
                                        ] && (

                                            <div className="ml-4">

                                                {(
                                                    groupScheduleExceptions[
                                                        school.id
                                                    ] || []
                                                ).map(exception => (

                                                    <div
                                                        key={exception.id}
                                                        className="
                                                            tree-file
                                                            cursor-pointer
                                                        "
                                                        onContextMenu={(e) => {

                                                            if (!canManageSchool(school)) {
                                                                return;
                                                            }

                                                            e.preventDefault();

                                                            setContextMenu({
                                                                type: "schedule-exception",
                                                                exception,
                                                                schoolId: school.id,
                                                                x: e.clientX,
                                                                y: e.clientY
                                                            });

                                                        }}
                                                    >
                                                        {exception.date}
                                                        {" - "}
                                                        {scheduleExceptionLabels[
                                                            exception.type
                                                        ]}
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
                    

                <div className="mt-6 border-t pt-2">

                    <div
                        className="tree-folder"
                        onClick={() =>
                            setArchiveOpen(
                                prev => !prev
                            )
                        }
                    >
                        <TreeDisclosureIcon open={archiveOpen} />

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
                                        title: "Arkiverade elever",
                                        type: "archived-students"
                                    })
                                }
                            >
                                Arkiverade elever
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

                            <div
                                className="tree-file"
                                onClick={() =>
                                    openTab({
                                        id: "archived-assessments",
                                        title: "Prov",
                                        type: "archived-assessments"
                                    })
                                }
                            >
                                Prov
                            </div>

                            <div
                                className="tree-file"
                                onClick={() =>
                                    openTab({
                                        id: "archived-presentations",
                                        title: "Presentationer",
                                        type: "archived-presentations"
                                    })
                                }
                            >
                                Presentationer
                            </div>

                        </div>

                    )}

                    {user?.role === "super" && (

                        <>
                            <div
                                className="tree-folder mt-2"
                                onClick={() =>
                                    setSettingsOpen(
                                        previous => !previous
                                    )
                                }
                            >
                                <TreeDisclosureIcon open={settingsOpen} />
                                Inställningar
                            </div>

                            {settingsOpen && (
                                <div className="ml-6">
                                    <div
                                        className="tree-folder"
                                        onClick={() =>
                                            setAssessmentSettingsOpen(
                                                previous => !previous
                                            )
                                        }
                                    >
                                        <TreeDisclosureIcon open={assessmentSettingsOpen} />
                                        Assessments
                                    </div>

                                    {assessmentSettingsOpen && (
                                        <div className="ml-4">
                                            <div
                                                className="tree-file"
                                                onClick={() =>
                                                    openTab({
                                                        id: "assessment-settings-diagnostic",
                                                        title: "Assessments - Diagnos",
                                                        type: "assessment-settings",
                                                        assessmentType: "diagnostic"
                                                    })
                                                }
                                            >
                                                Diagnos
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>

                    )}

                </div>

                <div className="mt-2">
                    <div
                        className="tree-folder"
                        onClick={() => setTrashOpen(previous => !previous)}
                    >
                        <TreeDisclosureIcon open={trashOpen} />
                        <span>Papperskorg</span>
                    </div>

                    {trashOpen && (
                        <div className="ml-6">
                            {[
                                ["Grupper", "trash-groups", "groups"],
                                ["Elever i grupper", "trash-students", "students"],
                                ["Block", "trash-blocks", "blocks"],
                                ["Uppgifter", "trash-questions", "questions"],
                                ["Prov", "trash-assessments", "assessments"],
                                ["Presentationer", "trash-presentations", "presentations"]
                            ].map(([title, id, kind]) => (
                                <div
                                    className="tree-file"
                                    key={id}
                                    onClick={() => openTab({
                                        id,
                                        title,
                                        type: "trash",
                                        kind
                                    })}
                                >
                                    {title}
                                </div>
                            ))}
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
            <SharePlanningDialog
                open={!!sharePlanningDialog}
                groupId={sharePlanningDialog?.groupId}
                onOpenChange={() =>
                    setSharePlanningDialog(null)
                }
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
            <GroupAbilitySeriesDialog
                group={abilitySeriesDialog}
                open={!!abilitySeriesDialog}
                onOpenChange={() =>
                    setAbilitySeriesDialog(null)
                }
                onSaved={loadGroups}
            />
            <GroupBookDialog
                group={groupBookDialog}
                books={books}
                open={!!groupBookDialog}
                onOpenChange={() => setGroupBookDialog(null)}
                onSaved={loadGroups}
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
            <EditStudentDialog
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

            <ResetPasswordDialog
                student={staffPasswordDialog}
                open={!!staffPasswordDialog}
                passwordUrl={staffPasswordDialog
                    ? `${API_URL}/api/schools/${staffPasswordDialog.schoolId}/staff/${staffPasswordDialog.userId}/password`
                    : null}
                entityLabel="Personal"
                onOpenChange={() =>
                    setStaffPasswordDialog(null)
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

            <ImportExistingStudentDialog
                group={importExistingStudentDialog}
                open={!!importExistingStudentDialog}
                onOpenChange={() =>
                    setImportExistingStudentDialog(null)
                }
                onImported={() =>
                    loadStudents(
                        importExistingStudentDialog.groupId
                    )
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
            <RenameLevelDialog
                open={!!renameLevelDialog}
                level={renameLevelDialog}
                onOpenChange={() =>
                    setRenameLevelDialog(null)
                }
                onRenamed={loadSubjects}
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
            <DeleteAbilitySeriesDialog
                open={!!deleteAbilitySeriesDialog}
                series={deleteAbilitySeriesDialog}
                onOpenChange={() =>
                    setDeleteAbilitySeriesDialog(null)
                }
                onDeleted={loadAbilitySeries}
            />
            <CreateClassroomDialog
                open={createClassroomDialogOpen}
                onOpenChange={setCreateClassroomDialogOpen}
                onCreated={loadClassrooms}
                schoolId={selectedSchoolId}
            />
            <CreateClassroomLayoutDialog
                open={createLayoutDialogOpen}
                onOpenChange={
                    setCreateLayoutDialogOpen
                }
                classroomId={
                    selectedClassroomId
                }
                onCreated={async () => {
                    await loadClassrooms();
                }}
            />
            <RenameClassroomDialog
                open={!!renameClassroomDialog}
                classroom={renameClassroomDialog}
                onOpenChange={() =>
                    setRenameClassroomDialog(null)
                }
                onRenamed={loadClassrooms}
            />
            <DeleteClassroomDialog
                open={!!deleteClassroomDialog}
                classroom={deleteClassroomDialog}
                onOpenChange={() =>
                    setDeleteClassroomDialog(null)
                }
                onDeleted={loadClassrooms}
            />
            <RenameLayoutDialog
                open={!!renameLayoutDialog}
                layout={renameLayoutDialog}
                onOpenChange={() =>
                    setRenameLayoutDialog(null)
                }
                onRenamed={loadClassrooms}
            />
            <DeleteLayoutDialog
                open={!!deleteLayoutDialog}
                layout={deleteLayoutDialog}
                onOpenChange={() =>
                    setDeleteLayoutDialog(null)
                }
                onDeleted={loadClassrooms}
            />
            <DuplicateLayoutDialog
                open={!!duplicateLayoutDialog}
                layout={duplicateLayoutDialog}
                onOpenChange={() =>
                    setDuplicateLayoutDialog(null)
                }
                onDuplicated={loadClassrooms}
            />
            <CreateScheduleExceptionDialog
                open={!!createScheduleExceptionDialog}
                school={createScheduleExceptionDialog}
                onOpenChange={() =>
                    setCreateScheduleExceptionDialog(null)
                }
                onCreated={() => {

                    loadSchoolScheduleExceptions(
                        createScheduleExceptionDialog.schoolId
                    );

                }}
            />
            <DeleteScheduleExceptionDialog
                open={!!deleteScheduleExceptionDialog}
                exception={
                    deleteScheduleExceptionDialog
                }
                onOpenChange={() =>
                    setDeleteScheduleExceptionDialog(
                        null
                    )
                }
                onDeleted={() => {

                    loadSchoolScheduleExceptions(
                        deleteScheduleExceptionDialog
                            .schoolId
                    );

                }}
            />
            <ImportScheduleExceptionsDialog
                open={!!importScheduleExceptionsDialog}
                school={importScheduleExceptionsDialog}
                onOpenChange={() =>
                    setImportScheduleExceptionsDialog(null)
                }
                onImported={() => {
                    loadSchoolScheduleExceptions(
                        importScheduleExceptionsDialog.schoolId
                    );
                }}
            />
            <EditScheduleExceptionDialog
                open={!!editScheduleExceptionDialog}
                exception={editScheduleExceptionDialog}
                onOpenChange={() =>
                    setEditScheduleExceptionDialog(null)
                }
                onSaved={() => {

                    loadSchoolScheduleExceptions(
                        editScheduleExceptionDialog.schoolId
                    );

                }}
            />
            <PrintLoginDialog
                open={!!printLoginsGroup}
                group={printLoginsGroup}
                onOpenChange={() =>
                    setPrintLoginsGroup(null)
                }
            />
            <CreateStaffDialog
                school={selectedSchoolForStaff}
                open={createStaffOpen}
                onOpenChange={setCreateStaffOpen}
                onCreated={() => {
                    if (selectedSchoolForStaff?.schoolId) {
                        loadSchoolStaff(
                            selectedSchoolForStaff.schoolId
                        );
                    }
                }}
            />
        </>
    )
}