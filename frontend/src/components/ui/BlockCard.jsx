import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";
import FormatDate from "@/utils/FormatDate";

export default function BlockCard({
    block,
    dragPrefix = "block",
    openTab,
    onDelete,
    onRemoveCentralContent,
    onRemoveSection,
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
                dragPrefix === "exam"
                    ? "exam-block"
                    : "block",

            blockId: block.id,
            block
        }
    });

    const {
        setNodeRef: setDropRef
    } = useDroppable({
        id: `exam-block-${block.id}`
    });

    const setRefs = (node) => {

        setDragRef(node);

        if (dragPrefix === "exam") {
            setDropRef(node);
        }

    };

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        opacity: transform ? 0.7 : 1
    };

    return (

        <div
            ref={setRefs}
            style={style}
        >

            <div className="border rounded p-4">

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

                </div>
            
                {block.questions?.length > 0 && (

                    <MathContent
                        value={block.questions[0].question}
                        className="p-2"
                    />

                )}

                <p className="mt-2 text-sm text-gray-500">

                    {block.questions?.length ?? 0}
                    {" "}
                    {block.questions?.length === 1
                        ? "fråga"
                        : "frågor"}

                </p>

                <div className="mt-3">

                    <h4 className="font-semibold text-sm">
                        Referenser
                    </h4>

                    {block.centralContent?.length > 0 && (
                        <>
                            <p className="text-xs text-muted-foreground">
                                Centralt innehåll
                            </p>

                            {block.centralContent.map(item => (
                                <div key={item.id} className="flex justify-between items-center">
                                    {item.content}
                                    <Button
                                        variant="ghost"
                                        className="text-red-500"
                                        onClick={() =>
                                            onRemoveCentralContent(
                                                block.id,
                                                item.id
                                            )
                                        }
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>


                            ))}
                        </>
                    )}

                    {block.bookSections?.length > 0 && (
                        <>
                            <p className="text-xs text-muted-foreground mt-2">
                                Bok
                            </p>

                            {block.bookSections.map(section => (
                                <div key={section.id} className="flex justify-between items-center">
                                    {section.title}
                                    <Button
                                        variant="ghost"
                                        className="text-red-500"
                                        onClick={() =>
                                            onRemoveSection(
                                                block.id,
                                                section.id
                                            )
                                        }
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>    
                            ))}
                            
                        </>
                    )}

                </div>

                <p>
                    Skapad av
                    {" "}
                    {block.created_by_first_name}
                    {" "}
                    {block.created_by_last_name}
                    {" "}
                    den
                    {" "}
                    <FormatDate value={block.created_at} />
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
                    <FormatDate value={block.updated_at} />
                </p>

                <Button
                    className="mt-3"
                    onClick={() =>
                        openTab({
                            id: `block-${block.id}`,
                            title: `ID: ${block.id}`,
                            type: "block",
                            block
                        })
                    }
                >
                    Öppna
                </Button>

                <Button
                    variant="destructive"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                    }}
                    onClick={() => onDelete(block.id)}
                >
                    Ta bort
                </Button>

            </div>

        </div>

    );

}