import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { GripVertical } from "lucide-react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";
import FormatDateTimeShort from "@/utils/formatDateTimeShort";
import BlockPoints from "@/components/ui/BlockPoints";

export default function BlockCard({
    block,
    dragPrefix = "block",
    openTab,
    onDelete,
    onCopy,
    onArchive,
    onRemoveCentralContent,
    onRemoveSection,
    onRemoveAbility,
    onEditPoint,
    canRemoveFromExam,
    orderNumber

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
    const [showPoints, setShowPoints] = useState(false);
    const pointsCount = block.points?.length ?? 0;

    const referenceCount =
        (block.bookSections?.length ?? 0) +
        (block.abilities?.length ?? 0);

    const totalPoints =
        block.points?.reduce(
            (sum, point) =>
                sum + Number(point.points),
            0
        ) ?? 0;

    return (

        <div
            ref={setRefs}
            style={style}
            className="w-full"
        >

            <div className="card h-full">

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
            
                {block.questions?.length > 0 && (

                    <MathContent
                        value={block.questions[0].question}
                        className="p-2"
                    />

                )}

                <p className="mt-2 text-sm text-muted-foreground">

                    {block.questions?.length ?? 0}
                    {" "}
                    {block.questions?.length === 1
                        ? "fråga"
                        : "frågor"}

                </p>

                {referenceCount > 0 && (

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
                            {showReferences
                                ? "▼"
                                : "▶"}
                            {" "}
                            Referenser
                            ({referenceCount})
                        </Button>

                        {showReferences && (

                            <div className="mt-2">

                                {block.abilities?.length > 0 && (
                                    <>
                                        <p
                                            className="
                                                text-xs
                                                text-muted-foreground
                                                mt-2
                                            "
                                        >
                                            Förmågor
                                        </p>

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
                                                    "
                                                >
                                                    {ability.name}

                                                    {block.canEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            className="text-red-500"
                                                            onClick={() =>
                                                                onRemoveAbility?.(
                                                                    block.id,
                                                                    ability.id
                                                                )
                                                            }
                                                        >
                                                            <X size={14} />
                                                        </Button>
                                                    )}

                                                </div>
                                            ))}
                                    </>
                                )}                                    

                                {block.bookSections?.length > 0 && (
                                    <>
                                        <p
                                            className="
                                                text-xs
                                                text-muted-foreground
                                                mt-2
                                            "
                                        >
                                            Bok
                                        </p>

                                        {block.bookSections.map(
                                            section => (
                                                <div
                                                    key={section.id}
                                                    className="
                                                        flex
                                                        justify-between
                                                        items-center
                                                    "
                                                >
                                                    {section.title}

                                                    {block.canEdit && (

                                                        <Button
                                                            variant="ghost"
                                                            className="text-red-500"
                                                            onClick={() =>
                                                                onRemoveSection?.(
                                                                    block.id,
                                                                    section.id
                                                                )
                                                            }
                                                        >
                                                            <X size={14} />
                                                        </Button>

                                                    )}

                                                </div>
                                            )
                                        )}
                                    </>
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
                                {showPoints ? "▼" : "▶"}
                                {" "}
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
                            block
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

                {block.isOwner && (

                    <Button
                        variant="outline"
                        onClick={() =>
                            onArchive?.(block)
                        }
                    >
                        Arkivera
                    </Button>

                )}

                {onDelete && canRemoveFromExam && (

                    <Button
                        variant="destructive"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                        onClick={() =>
                            onDelete(block.id)
                        }
                    >
                        Ta bort
                    </Button>

                )}

            

            </div>

        </div>

    );

}