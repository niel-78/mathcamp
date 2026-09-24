import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { AlertCircle, BookOpen, ChevronDown, ChevronRight, GraduationCap, GripVertical, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MathContent from "@/components/ui/MathContent";
import FormatDateTimeShort from "@/utils/formatDateTimeShort";
import BlockPoints from "@/components/ui/BlockPoints";
import ExportBlockDialog from "@/components/ui/ExportBlockDialog";
import QuestionImagePreview from "@/components/ui/QuestionImagePreview";
import { getBlockIssues } from "@/utils/getQuestionIssues";

export { getBlockIssues };

function DisclosureIcon({ open }) {
    const Icon = open ? ChevronDown : ChevronRight;

    return <Icon className="mr-1 inline-block h-4 w-4" aria-hidden="true" />;
}

export default function BlockCard({
    block,
    dragPrefix = "block",
    openTab,
    onDelete,
    deleteLabel = "Ta bort block",
    onCopy,
    onArchive,
    onRemoveCentralContent,
    onRemoveSection,
    onRemoveAbility,
    onAddAbility,
    abilityOptions = [],
    abilitySourceLabel = "Förmågor",
    onEditPoint,
    canRemoveFromExam,
    orderNumber
    ,groupId = null
    ,groupName = null

}) {

    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        transform
    } = useDraggable({
        id: `${dragPrefix}-block-${block.id}`,
        data: {
            type:
                dragPrefix === "assessment"
                    ? "assessment-block"
                    : "block",

            blockId: block.id,
            block
        }
    });

    const setRefs = (node) => {

        setDragRef(node);

    };

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,

        opacity: transform ? 0.7 : 1,

        zIndex: transform
            ? 9999
            : undefined,

        position: transform
            ? "relative"
            : undefined
    };

    const [showReferences, setShowReferences] = useState(false);
    const [showAbilityOptions, setShowAbilityOptions] = useState(false);
    const [showPoints, setShowPoints] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const questionCount = block.question_count ?? block.questions?.length ?? 0;
    const priorityQuestionCount = block.priority_question_count ?? block.questions?.filter(
        question => Boolean(question.is_priority)
    ).length ?? 0;
    const pointsCount = block.point_count ?? block.points?.length ?? 0;

    const books = block.books?.length > 0
        ? block.books
        : Array.from(new Map(
            (block.bookSections || [])
                .filter(s => s.book_title)
                .map(s => [s.book_id || s.book_title, { id: s.book_id, title: s.book_title }])
          ).values());

    const courses = block.courses?.length > 0
        ? block.courses
        : Array.from(new Map([
            ...(block.bookSections || [])
                .filter(s => s.course_level_name)
                .map(s => [s.course_level_id || s.course_level_name, { id: s.course_level_id, name: s.course_level_name, code: s.course_level_code }]),
            ...(block.points || [])
                .filter(p => p.level_name)
                .map(p => [p.level_id || p.level_name, { id: p.level_id, name: p.level_name }])
          ]).values());

    const referenceCount =
        (block.bookSections?.length ?? 0) +
        (block.abilities?.length ?? 0) +
        (courses.length > 0 && (block.bookSections?.length ?? 0) === 0 ? courses.length : 0);

    const totalPoints =
        Number(block.total_points ?? block.points?.reduce(
            (sum, point) =>
                sum + Number(point.points),
            0
        ) ?? 0);

    const firstQuestionData = block.questions?.[0];
    const firstQuestion = firstQuestionData?.question;
    const attachedAbilityIds = new Set(
        (block.abilities || []).map(ability => ability.id)
    );
    const availableAbilities = abilityOptions.filter(
        ability => !attachedAbilityIds.has(ability.id)
    );

    const issues = getBlockIssues(block);

    return (

        <div
            ref={setRefs}
            style={style}
            className="w-full"
        >

            <div className={`card h-full ${issues.length > 0 ? "border-amber-300/80 bg-amber-50/10" : ""}`}>

                <div className="flex justify-end mb-2">

                    <Button
                        variant="ghost"
                        {...listeners}
                        {...attributes}
                        className="
                            cursor-grab
                            active:cursor-grabbing
                            text-slate-400
                            hover:text-slate-700
                        "
                    >
                        <GripVertical size={20} />
                    </Button>

                </div>

                <div className="flex justify-between">

                    <span className="font-semibold">
                        {orderNumber !== undefined && (
                            <>
                                {orderNumber}.{" "}
                            </>
                        )}
                    </span>

                    <span className="font-semibold">
                        ID: {block.id}
                    </span>

                    <div className="mt-2">

                        <span
                            className="
                                inline-block
                                rounded-md
                                bg-muted
                                px-2
                                py-1
                                text-xs
                            "
                        >

                            {
                                block.visibility === "global"
                                    ? "Globalt"
                                    : block.visibility === "school"
                                    ? "Skolan"
                                    : "Privat"
                            }

                        </span>

                    </div>

                </div>
            
                {(courses.length > 0 || books.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 my-2">
                        {courses.map(course => (
                            <Badge
                                key={course.id || course.name}
                                variant="secondary"
                                className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-medium"
                                title="Kurs / Nivå"
                            >
                                <GraduationCap size={12} className="mr-1 inline-block" />
                                {course.name}
                            </Badge>
                        ))}

                        {books.map(b => (
                            <Badge
                                key={b.id || b.title}
                                variant="outline"
                                className="text-xs bg-amber-50/80 text-amber-850 border-amber-200/80 font-normal"
                                title="Bok"
                            >
                                <BookOpen size={12} className="mr-1 inline-block text-amber-700" />
                                {b.title}
                            </Badge>
                        ))}
                    </div>
                )}

                {firstQuestionData && (

                    <>
                        <QuestionImagePreview
                            media={firstQuestionData.media}
                            compact
                        />
                        {firstQuestion && (
                            <MathContent
                                value={firstQuestion}
                                className="p-2"
                            />
                        )}
                    </>

                )}

                <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            {questionCount}
                            {" "}
                            {questionCount === 1
                                ? "fråga"
                                : "frågor"}
                        </p>

                        <Badge
                            variant="secondary"
                            className="gap-1 text-xs"
                            title="Antal prioriterade uppgifter i blocket"
                        >
                            <Star size={12} />
                            Prioriterade: {priorityQuestionCount}
                        </Badge>
                    </div>

                    {issues.length > 0 && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertCircle size={12} />
                            {issues.length} {issues.length === 1 ? "fel" : "fel"}
                        </Badge>
                    )}
                </div>

                {issues.length > 0 && (
                    <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-1.5">
                        <div className="flex items-center gap-1.5 font-semibold">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>Varningar i blocket ({issues.length} st):</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 opacity-90">
                            {issues.map((issue, idx) => (
                                <li key={idx}>
                                    {issue.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {(referenceCount > 0 ||
                    (block.canEdit && abilityOptions.length > 0)) && (

                    <div className="mt-3">

                        <Button
                            type="button"
                            onClick={() =>
                                setShowReferences(
                                    !showReferences
                                )
                            }
                            className="
                                text-sm
                                font-semibold

                                hover:text-primary
                            "
                        >
                            <DisclosureIcon open={showReferences} />
                            Referenser
                            ({referenceCount})
                        </Button>

                        {showReferences && (

                            <div className="mt-2 space-y-2">

                                {courses.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                                            <GraduationCap size={13} />
                                            Kurser / Nivåer
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {courses.map(course => (
                                                <Badge
                                                    key={course.id || course.name}
                                                    variant="secondary"
                                                    className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                                                >
                                                    {course.name}
                                                    {course.code && course.code !== course.name ? ` (${course.code})` : ""}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {block.bookSections?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                                            <BookOpen size={13} />
                                            Böcker & Avsnitt
                                        </p>

                                        <div className="space-y-1">
                                            {block.bookSections.map(section => (
                                                <div
                                                    key={section.id}
                                                    className="flex justify-between items-center text-sm py-0.5"
                                                >
                                                    <span className="text-xs">
                                                        {section.book_title ? (
                                                            <span className="font-semibold text-muted-foreground mr-1">
                                                                [{section.book_title}]
                                                            </span>
                                                        ) : null}
                                                        {section.title}
                                                    </span>

                                                    {block.canEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="xs"
                                                            className="text-red-500 hover:text-red-700 size-6 p-0"
                                                            onClick={() =>
                                                                onRemoveSection?.(
                                                                    block.id,
                                                                    section.id
                                                                )
                                                            }
                                                        >
                                                            <X size={12} />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {block.abilities?.length > 0 && (
                                    <div>
                                        <p
                                            className="
                                                text-xs
                                                font-semibold
                                                text-muted-foreground
                                                mb-1
                                            "
                                        >
                                            Förmågor
                                        </p>

                                        <div className="space-y-1">
                                            {[...block.abilities]
                                                .sort((a, b) =>
                                                    a.name.localeCompare(
                                                        b.name,
                                                        "sv"
                                                    )
                                                )
                                                .map(ability => (
                                                    <div
                                                        key={ability.id}
                                                        className="
                                                            flex
                                                            justify-between
                                                            items-center
                                                            text-xs
                                                        "
                                                    >
                                                        {ability.name}

                                                        {block.canEdit && (
                                                            <Button
                                                                variant="ghost"
                                                                size="xs"
                                                                className="text-red-500 hover:text-red-700 size-6 p-0"
                                                                onClick={() =>
                                                                    onRemoveAbility?.(
                                                                        block.id,
                                                                        ability.id
                                                                    )
                                                                }
                                                            >
                                                                <X size={12} />
                                                            </Button>
                                                        )}

                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {block.canEdit && abilityOptions.length > 0 && (

                                    <div className="mt-3">

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setShowAbilityOptions(
                                                    !showAbilityOptions
                                                )
                                            }
                                        >
                                            <Plus size={16} />
                                            Lägg till förmåga
                                        </Button>

                                        {showAbilityOptions && (

                                            <div className="mt-2">

                                                <p className="text-xs text-muted-foreground">
                                                    {abilitySourceLabel}
                                                </p>

                                                {availableAbilities.length > 0
                                                    ? availableAbilities.map(ability => (
                                                        <Button
                                                            key={ability.id}
                                                            type="button"
                                                            variant="ghost"
                                                            className="w-full justify-start"
                                                            onClick={() =>
                                                                onAddAbility?.(
                                                                    block.id,
                                                                    ability.id
                                                                )
                                                            }
                                                        >
                                                            <Plus size={14} />
                                                            {ability.name}
                                                        </Button>
                                                    ))
                                                    : (
                                                        <p className="text-sm text-muted-foreground">
                                                            Alla förmågor är redan kopplade.
                                                        </p>
                                                    )}

                                            </div>

                                        )}

                                    </div>

                                )}

                            </div>

                        )}

                    </div>

                )}

                {totalPoints > 0 && (

                    <div className="mt-3">

                        <div className="flex items-center gap-2">

                            <Button
                                type="button"
                                onClick={() =>
                                    setShowPoints(!showPoints)
                                }
                            >
                                <DisclosureIcon open={showPoints} />
                                Poäng
                                ({totalPoints} p)
                            </Button>

                            {block.canEdit && (

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        onEditPoint?.(null)
                                    }
                                >
                                    +
                                </Button>

                            )}

                        </div>

                        {showPoints && (

                            <BlockPoints
                                points={block.points}
                                canEdit={block.canEdit}
                                onEditPoint={onEditPoint}
                            />

                        )}

                    </div>

                )}

                <p>
                    Skapad av
                    {" "}
                    {block.created_by_first_name}
                    {" "}
                    {block.created_by_last_name}
                    {" "}
                    den
                    {" "}
                    <FormatDateTimeShort value={block.created_at} />
                </p>

                <p>
                    Uppdaterad av
                    {" "}
                    {block.updated_by_first_name}
                    {" "}
                    {block.updated_by_last_name}
                    {" "}
                    den
                    {" "}
                    <FormatDateTimeShort value={block.updated_at} />
                </p>

                <Button
                    className="mt-3"
                    onClick={() =>
                        openTab({
                            id: `block-${block.id}`,
                            title: `Block #${block.id}`,
                            type: "block",
                            block,
                            groupId,
                            groupName
                        })
                    }
                >
                    {block.canEdit
                        ? "Redigera"
                        : "Visa"}
                </Button>

                {block.canCopy && (

                    <Button
                        variant="outline"
                        onClick={() =>
                            onCopy?.(block.id)
                        }
                    >
                        Kopiera
                    </Button>

                )}

                <Button
                    variant="outline"
                    onClick={() =>
                        setShowExport(true)
                    }
                >
                    Exportera
                </Button>

                <ExportBlockDialog
                    open={showExport}
                    onOpenChange={setShowExport}
                    blockId={block.id}
                    block={block}
                />

                {block.canEdit && (

                    <Button
                        variant="outline"
                        onClick={() =>
                            onArchive?.(block)
                        }
                    >
                        Arkivera
                    </Button>

                )}

                {(onDelete && (canRemoveFromExam || deleteLabel !== "Ta bort block")) && (

                    <Button
                        variant={deleteLabel === "Ta bort block" ? "destructive" : "outline"}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                        onClick={() =>
                            onDelete(block.id)
                        }
                    >
                        {deleteLabel}
                    </Button>

                )}

            

            </div>

        </div>

    );

}