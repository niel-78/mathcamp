import { Button } from "@/components/ui/button";
import AbilitySeriesMenu from "./menus/AbilitySeriesMenu";
import GroupMenu from "./menus/GroupMenu";
import StudentMenu from "./menus/StudentMenu";
import StudentsMenu from "./menus/StudentsMenu";
import AbilityMenu from "./menus/AbilityMenu";
import GroupsMenu from "./menus/GroupsMenu";
import BooksMenu from "./menus/BooksMenu";
import BookMenu from "./menus/BookMenu";
import SubjectMenu from "./menus/SubjectMenu";
import CentralContentLevelMenu from "./menus/CentralContentLevelMenu";
import CriteriaLevelMenu from "./menus/CriteriaLevelMenu";
import LevelMenu from "./menus/LevelMenu";


export default function ContextMenu({
    contextMenu,
    setContextMenu,
    user,
    setCreateAbilityDialog,
    setImportAbilitiesDialog,
    setRenameAbilitySeriesDialog,
    setRenameDialog,
    setArchiveDialog,
    setPasswordDialog,
    setRenameStudentDialog,
    setArchiveStudentDialog,
    setCreateStudentDialog,
    setImportStudentsDialog
}) {

    return (
        <div>

            {
                contextMenu && (

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

                        {contextMenu?.type === "groups" && (

                            <GroupsMenu
                                onCreateGroup={() => {

                                    setShowCreateGroupDialog(true);

                                    setContextMenu(null);

                                }}
                            />

                        )}

                        {contextMenu?.type === "group" && (

                            <GroupMenu
                                contextMenu={contextMenu}
                                setContextMenu={setContextMenu}
                                setRenameDialog={setRenameDialog}
                                setArchiveDialog={setArchiveDialog}
                            />

                        )}

                        {contextMenu?.type === "planning" && (

                            <div className="context-menu">

                                <Button
                                    className="context-menu-button"
                                    variant="inline"
                                    onClick={() => {

                                        setCreateLessonSeriesDialog({
                                            groupId: contextMenu.groupId,
                                            groupName: contextMenu.groupName
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Skapa lektioner
                                </Button>
                                <Button
                                    variant="inline"
                                    className="context-menu-button"
                                    onClick={() => {

                                        openTab({
                                            id: `group-schedules-${contextMenu.groupId}`,
                                            type: "group-schedules",
                                            title: `${contextMenu.groupName} - Scheman`,
                                            groupId: contextMenu.groupId
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Hantera schema
                                </Button>
                                <Button
                                    variant="inline"
                                    className="context-menu-button"
                                    onClick={() => {

                                        openTab({
                                            id: `planning-queue-${contextMenu.groupId}`,
                                            type: "planning-queue",
                                            title: `${contextMenu.groupName} - Planeringskö`,
                                            groupId: contextMenu.groupId
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Planeringskö
                                </Button>

                            </div>

                        )}

                        {contextMenu?.type === "student" && (

                            <StudentMenu
                                contextMenu={contextMenu}

                                onResetPassword={() => {

                                    setPasswordDialog({
                                        id: contextMenu.userId,
                                        name: `${contextMenu.firstName} ${contextMenu.lastName}`
                                    });

                                    setContextMenu(null);

                                }}

                                onRename={() => {

                                    setRenameStudentDialog({
                                        id: contextMenu.userId,
                                        groupId: contextMenu.groupId,
                                        firstName: contextMenu.firstName,
                                        lastName: contextMenu.lastName
                                    });

                                    setContextMenu(null);

                                }}

                                onArchive={() => {

                                    setArchiveStudentDialog({
                                        userId: contextMenu.userId,
                                        groupId: contextMenu.groupId,
                                        name: `${contextMenu.firstName} ${contextMenu.lastName}`
                                    });

                                    setContextMenu(null);

                                }}
                            />

                        )}

                        {contextMenu?.type === "students" && (

                            <StudentsMenu

                                onCreateStudent={() => {

                                    setCreateStudentDialog({
                                        groupId: contextMenu.groupId,
                                        groupName: contextMenu.groupName
                                    });

                                    setContextMenu(null);

                                }}

                                onImportStudents={() => {

                                    setImportStudentsDialog({
                                        groupId: contextMenu.groupId,
                                        groupName: contextMenu.groupName
                                    });

                                    setContextMenu(null);

                                }}

                            />

                        )}

                        {contextMenu?.type === "subject" &&
                        user?.role === "super" && (

                            <SubjectMenu
                                onCreateLevel={() => {

                                    setCreateLevelDialog({
                                        subjectId: contextMenu.subjectId,
                                        subjectName: contextMenu.subjectName
                                    });

                                    setContextMenu(null);

                                }}
                            />

                        )}

                        {contextMenu?.type === "central-content-level" &&
                        user?.role === "super" && (

                            <CentralContentLevelMenu
                                onImportCentralContent={() => {

                                    setImportCentralContentDialog({
                                        levelId: contextMenu.levelId,
                                        levelName: contextMenu.levelName
                                    });

                                    setContextMenu(null);

                                }}
                            />

                        )}

                        {contextMenu?.type === "criteria-level" &&
                        user?.role === "super" && (

                            <CriteriaLevelMenu
                                onImportCriteria={() => {

                                    setImportCriteriaDialog({
                                        levelId: contextMenu.levelId,
                                        levelName: contextMenu.levelName
                                    });

                                    setContextMenu(null);

                                }}
                            />

                        )}

                        {contextMenu?.type === "ability-subject" &&
                        user?.role === "super" && (

                            <div className="context-menu">

                                <Button
                                    className="context-menu-button"
                                    variant="inline"
                                    onClick={() => {

                                        setCreateAbilityDialog({
                                            id: contextMenu.seriesId,
                                            name: contextMenu.seriesName
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Lägg till förmåga
                                </Button>

                                <Button
                                    className="context-menu-button"
                                    variant="inline"
                                    onClick={() => {

                                        setImportAbilitiesDialog({
                                            subjectId:
                                                contextMenu.subjectId,
                                            subjectName:
                                                contextMenu.subjectName
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Lägg till förmågor via Excel
                                </Button>

                                <Button
                                    variant="inline"
                                    className="context-menu-button"
                                    onClick={() => {
                                        setRenameAbilitySeriesDialog({
                                            id: contextMenu.seriesId,
                                            name: contextMenu.seriesName
                                        });

                                        setContextMenu(null);

                                    }}
                                >
                                    Byt namn
                                </Button>

                            </div>

                        )}

                        {contextMenu?.type === "level" &&
                        user?.role === "super" && (

                            <LevelMenu
                                onCreateBook={() => {

                                    setCreateBookDialog({
                                        levelId: contextMenu.levelId,
                                        levelName: contextMenu.levelName
                                    });

                                    setContextMenu(null);

                                }}
                            />

                        )}

                        {contextMenu?.type === "books" &&
                        user?.role === "super" && (

                            <BooksMenu
                                onCreateBook={() => {

                                    setCreateBookDialog(true);

                                    setContextMenu(null);

                                }}
                            />

                        )}

                        {contextMenu?.type === "book" &&
                        user?.role === "super" && (

                            <BookMenu
                                onImportStructure={() => {

                                    setImportBookStructureDialog({
                                        id: contextMenu.bookId,
                                        title: contextMenu.bookTitle
                                    });

                                    setContextMenu(null);

                                }}
                            />

                        )}

                        {contextMenu?.type === "abilities" && (

                            <div className="context-menu">
                                <Button
                                    variant="inline"
                                    className="context-menu-button"
                                    onClick={() => {

                                        setCreateAbilitySeriesDialog(true);

                                        setContextMenu(null);

                                    }}
                                >
                                    Ny serie
                                </Button>
                            </div>    

                        )}

                        {contextMenu?.type === "ability-series" && (

                            <AbilitySeriesMenu
                                contextMenu={contextMenu}
                                user={user}
                                setContextMenu={setContextMenu}
                                setCreateAbilityDialog={
                                    setCreateAbilityDialog
                                }
                                setImportAbilitiesDialog={
                                    setImportAbilitiesDialog
                                }
                                setRenameAbilitySeriesDialog={
                                    setRenameAbilitySeriesDialog
                                }
                            />

                        )}

                        {contextMenu?.type === "ability" &&
                        user?.role === "super" && (

                            <AbilityMenu

                                onRename={() => {

                                    setRenameAbilityDialog({
                                        id: contextMenu.abilityId,
                                        name: contextMenu.name
                                    });

                                    setContextMenu(null);

                                }}

                                onDelete={() => {

                                    setDeleteAbilityDialog({
                                        id: contextMenu.abilityId,
                                        name: contextMenu.name
                                    });

                                    setContextMenu(null);

                                }}

                            />

                        )}


                    </div>

                )
            }

        </div>
    );
}