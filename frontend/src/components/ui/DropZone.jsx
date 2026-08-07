import { useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";

export default function DropZone({
    id,
    text = "Släpp här",
    className = ""
}) {

    const {
        setNodeRef,
        isOver
    } = useDroppable({
        id
    });

    return (

        <div
            ref={setNodeRef}
            className={`
                rounded-xl
                border-2
                border-dashed

                transition-all
                duration-200

                flex
                flex-col
                items-center
                justify-center

                gap-2

                py-8
                px-4
                bg-primary/15
                border-primary

                ${
                    isOver

                        ? `
                            border-primary
                            bg-primary/10
                            scale-[1.02]
                          `

                        : `
                            border-border
                            bg-muted/30
                          `
                }

                ${className}
            `}
        >

            <Inbox
                size={28}
                className={`
                    ${
                        isOver
                            ? "text-primary"
                            : "text-muted-foreground"
                    }
                `}
            />

            <div
                className={`
                    text-sm
                    font-medium

                    ${
                        isOver
                            ? "text-primary"
                            : "text-muted-foreground"
                    }
                `}
            >
                {
                    isOver
                        ? "Släpp blocket här"
                        : text
                }
            </div>

        </div>

    );

}