import { useDraggable } from "@dnd-kit/core";

export default function DraggableTab({
    tab,
    activeTab,
    setActiveTab,
    closeTab,
    area
}) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
    } = useDraggable({
        id: `tab-${tab.id}`,
        data: {
            tab,
            sourceArea: area
        }
    });

    const isActive =
        activeTab === tab.id;

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
        }
        : undefined;

    return (

        <div
            ref={setNodeRef}
            style={style}
            onClick={() =>
                setActiveTab(tab.id)
            }
            className={`
                flex
                items-center
                gap-2
                px-3
                py-2
                border-r
                cursor-pointer
                select-none
                min-w-[150px]
                max-w-[250px]

                ${isActive
                    ? `
                        bg-white
                        border-t-2
                        border-t-blue-500
                        text-black
                        font-medium
                    `
                    : `
                        bg-slate-100
                        hover:bg-slate-200
                        text-slate-700
                    `
                }
            `}
        >

            <span
                {...listeners}
                {...attributes}
                onClick={(e) =>
                    e.stopPropagation()
                }
                className="
                    cursor-grab
                    text-slate-500
                    shrink-0
                "
            >
                ⠿
            </span>

            <span
                className="
                    truncate
                    flex-1
                "
            >
                {tab.title}
            </span>

            <button
                type="button"
                onClick={(e) => {

                    e.stopPropagation();

                    closeTab(tab.id);

                }}
                className="
                    shrink-0
                    text-slate-500
                    hover:text-red-500
                    px-1
                "
            >
                ×
            </button>

        </div>

    );

}