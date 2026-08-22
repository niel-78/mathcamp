import GroupsMenu from "./menus/GroupsMenu";
import GroupMenu from "./menus/GroupMenu";
import StudentsMenu from "./menus/StudentsMenu";
import StudentMenu from "./menus/StudentMenu";
import PlanningMenu from "./menus/PlanningMenu";
import SubjectMenu from "./menus/SubjectMenu";
import LevelMenu from "./menus/LevelMenu";
import BooksMenu from "./menus/BooksMenu";
import BookMenu from "./menus/BookMenu";
import AbilitiesMenu from "./menus/AbilitiesMenu";
import AbilitySeriesMenu from "./menus/AbilitySeriesMenu";
import AbilityMenu from "./menus/AbilityMenu";
import CriteriaLevelMenu from "./menus/CriteriaLevelMenu";
import CentralContentLevelMenu from "./menus/CentralContentLevelMenu";
import ClassroomsMenu from "./menus/ClassroomsMenu";
import ClassroomMenu from "./menus/ClassRoomMenu";
import ClassroomLayoutMenu from "./menus/ClassRoomLayoutMenu";
import ScheduleExceptionsMenu from "./menus/ScheduleExceptionsMenu";
import ScheduleExceptionMenu from "./menus/ScheduleExceptionMenu";

export default function ContextMenu(props) {

    const {
        contextMenu,
        user,
        setContextMenu,
    } = props;

    if (!contextMenu) {
        return null;
    }

    const renderMenu = () => {
        
        switch (contextMenu.type) {

            case "groups":
                return (
                    <GroupsMenu
                        onCreateGroup={() => {
                            props.onCreateGroup?.();
                            setContextMenu(null);
                        }}
                    />
                );

            case "group":
                return (
                    <GroupMenu
                        onRename={() => {
                            props.onRenameGroup?.(
                                contextMenu.groupId,
                                contextMenu.groupName
                            );

                            setContextMenu(null);
                        }}
                        onArchive={() => {
                            props.onArchiveGroup?.(
                                contextMenu.groupId,
                                contextMenu.groupName
                            );

                            setContextMenu(null);
                        }}
                    />
                );
                
            case "planning":
                return (
                    <PlanningMenu
                        onCreateLessons={() => {
                            props.onCreateLessons?.(
                                contextMenu.groupId,
                                contextMenu.groupName
                            );

                            setContextMenu(null);
                        }}
                        onManageSchedule={() => {
                            props.onManageSchedule?.(
                                contextMenu.groupId,
                                contextMenu.groupName
                            );

                            setContextMenu(null);
                        }}
                        onOpenQueue={() => {

                            if (!contextMenu.bookId) {
                                return;
                            }

                            props.onOpenQueue?.(
                                contextMenu.groupId,
                                contextMenu.groupName
                            );

                            setContextMenu(null);
                        }}
                    />
                );


            case "students":
                return (
                    <StudentsMenu
                        onCreateStudent={() => {
                            props.onCreateStudent?.(
                                contextMenu.groupId,
                                contextMenu.groupName
                            );

                            setContextMenu(null);
                        }}
                        onImportStudents={() => {
                            props.onImportStudents?.(
                                contextMenu.groupId,
                                contextMenu.groupName
                            );

                            setContextMenu(null);
                        }}
                    />
                );

            case "student":
                return (
                    <StudentMenu
                        contextMenu={contextMenu}
                        onResetPassword={() => {
                            props.onResetPassword?.(
                                contextMenu.userId,
                                `${contextMenu.firstName} ${contextMenu.lastName}`
                            );

                            setContextMenu(null);
                        }}
                        onRename={() => {
                            props.onRenameStudent?.(
                                contextMenu
                            );

                            setContextMenu(null);
                        }}
                        onArchive={() => {
                            props.onArchiveStudent?.(
                                contextMenu
                            );

                            setContextMenu(null);
                        }}
                    />
                );

            case "subject":

                if (user?.role !== "super") {
                    return null;
                }

                return (
                    <SubjectMenu
                        onCreateLevel={() => {
                            props.onCreateLevel?.(
                                contextMenu.subjectId,
                                contextMenu.subjectName
                            );

                            setContextMenu(null);
                        }}
                    />
                );

            case "level":

                if (user?.role !== "super") {
                    return null;
                }

                return (
                    <LevelMenu
                        onCreateBook={() => {
                            props.onCreateBook?.(
                                contextMenu.levelId,
                                contextMenu.levelName
                            );

                            setContextMenu(null);
                        }}
                    />
                );

            case "central-content-level":

                if (user?.role !== "super") {
                    return null;
                }

                return (
                    <CentralContentLevelMenu
                        onImportCentralContent={() => {
                            props.onImportCentralContent?.(
                                contextMenu.levelId,
                                contextMenu.levelName
                            );

                            setContextMenu(null);
                        }}
                        onDownloadTemplate={() => {
                            props.onDownloadCentralContentTemplate?.();
                            setContextMenu(null);
                        }}
                    />
                );

            case "criteria-level":

                if (user?.role !== "super") {
                    return null;
                }

                return (
                    <CriteriaLevelMenu

                        onImportCriteria={() => {
                            props.onImportCriteria?.(
                                contextMenu.levelId,
                                contextMenu.levelName
                            );

                            setContextMenu(null);
                        }}

                        onDownloadTemplate={() => {
                            props.onDownloadCriteriaTemplate?.();

                            setContextMenu(null);
                        }}

                    />
                );


            case "books":

                if (user?.role !== "super") {
                    return null;
                }

                return (
                    <BooksMenu
                        onCreateBook={() => {
                            props.onCreateBookRoot?.();

                            setContextMenu(null);
                        }}
                    />
                );

            case "book":

                if (user?.role !== "super") {
                    return null;
                }

                return (
                    <BookMenu
                        onImportStructure={() => {
                            props.onImportBookStructure?.(
                                contextMenu.bookId,
                                contextMenu.bookTitle
                            );

                            setContextMenu(null);
                        }}
                        onDownloadTemplate={() => {
                            props.onDownloadBookSectionsTemplate?.(
                                contextMenu.bookId
                            );

                            setContextMenu(null);
                        }}
                    />
                );

            case "abilities":
                return (
                    <AbilitiesMenu

                        onCreateSeries={() => {
                            props.onCreateAbilitySeries?.();

                            setContextMenu(null);
                        }}

                        onDownloadTemplate={() => {
                            props.onDownloadAbilityTemplate?.();

                            setContextMenu(null);
                        }}

                    />
                );

            case "ability-series":
                return (
                    <AbilitySeriesMenu
                        contextMenu={contextMenu}
                        user={user}
                        setContextMenu={setContextMenu}

                        onCreateAbility={() => {
                            props.onCreateAbility?.(
                                contextMenu.seriesId,
                                contextMenu.seriesName
                            );
                        }}

                        onImportAbilities={() => {
                            props.onImportAbilities?.(
                                contextMenu.seriesId,
                                contextMenu.seriesName
                            );
                        }}

                        onRenameSeries={() => {
                            props.onRenameAbilitySeries?.(
                                contextMenu.seriesId,
                                contextMenu.seriesName
                            );
                        }}
                        onDeleteSeries={() => {
                            props.onDeleteAbilitySeries?.(
                                contextMenu.seriesId,
                                contextMenu.seriesName
                            );

                            setContextMenu(null);
                        }}

                    />
                );

            case "ability":

                if (user?.role !== "super") {
                    return null;
                }

                return (
                    <AbilityMenu
                        onRename={() => {
                            props.onRenameAbility?.(
                                contextMenu.abilityId,
                                contextMenu.name
                            );

                            setContextMenu(null);
                        }}
                        onDelete={() => {
                            props.onDeleteAbility?.(
                                contextMenu.abilityId,
                                contextMenu.name
                            );

                            setContextMenu(null);
                        }}
                    />
                );

            case "classrooms":
                return (
                    <ClassroomsMenu
                        onCreate={() => {

                            props.setSelectedSchoolId(
                                contextMenu.schoolId
                            );

                            props.setCreateClassroomDialogOpen(
                                true
                            );

                            setContextMenu(null);
                        }}
                    />
                );

            case "classroom":
                return (
                    <ClassroomMenu
                        onCreateLayout={() => {

                            props.setSelectedClassroomId(
                                contextMenu.classroomId
                            );

                            props.setCreateLayoutDialogOpen(
                                true
                            );

                            setContextMenu(null);

                        }}

                        onRename={() => {

                            props.setRenameClassroomDialog({
                                id: contextMenu.classroomId,
                                name: contextMenu.classroomName
                            });

                            setContextMenu(null);

                        }}
                        onDelete={() => {

                            props.setDeleteClassroomDialog({
                                id: contextMenu.classroomId,
                                name: contextMenu.classroomName
                            });

                            setContextMenu(null);

                        }}
                    />
                );
            case "classroom-layout":
                return (
                    <ClassroomLayoutMenu
                        onRename={() => {

                            props.setRenameLayoutDialog({
                                id: contextMenu.layoutId,
                                name: contextMenu.layoutName,
                                classroomId: contextMenu.classroomId
                            });

                            setContextMenu(null);

                        }}

                        onDelete={() => {

                            props.setDeleteLayoutDialog({
                                id: contextMenu.layoutId,
                                name: contextMenu.layoutName,
                                classroomId: contextMenu.classroomId
                            });

                            setContextMenu(null);

                        }}

                        onDuplicate={() => {

                            props.setDuplicateLayoutDialog({
                                id: contextMenu.layoutId,
                                name: contextMenu.layoutName
                            });

                            setContextMenu(null);

                        }}
                                            />
                );

                case "schedule-exceptions":
                    return (
                        <ScheduleExceptionsMenu

                            onCreate={() => {

                                props.onCreateScheduleException?.(
                                    contextMenu.schoolId,
                                    contextMenu.schoolName
                                );

                                setContextMenu(null);
                            }}

                            onImport={() => {

                                props.onImportScheduleExceptions?.(
                                    contextMenu.schoolId,
                                    contextMenu.schoolName
                                );

                                setContextMenu(null);
                            }}
                            onDownloadTemplate={() => {

                                props.onDownloadScheduleExceptionTemplate?.();

                                setContextMenu(null);

                            }}

                        />
                    );

                case "schedule-exception":
                    return (
                        <ScheduleExceptionMenu
                            onDelete={() => {

                                props.onDeleteScheduleException?.(
                                    contextMenu.exceptionId,
                                    contextMenu.schoolId
                                );

                                setContextMenu(null);
                            }}
                        />
                    );

            default:
                return null;
        }
    };

    return (

        <div
            className="
                fixed
                bg-popover
                text-popover-foreground
                border
                border-border
                rounded-lg
                shadow-lg
                z-50
                min-w-40
            "
            style={{
                left: contextMenu.x,
                top: contextMenu.y
            }}
        >
            {renderMenu()}
        </div>

    );
}