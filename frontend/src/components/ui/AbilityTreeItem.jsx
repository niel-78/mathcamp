import { useDroppable } from "@dnd-kit/core";

export default function AbilityTreeItem({
    ability,
    hoverTarget,
    openTab,
    setContextMenu
}) {

    const {
        setNodeRef,
        isOver
    } = useDroppable({
        id: `ability-${ability.id}`
    });

    return (

        <div
            ref={setNodeRef}

            onClick={() => {

                openTab({
                    id: `ability-${ability.id}`,
                    title: ability.name,
                    type: "ability",
                    abilityId: ability.id
                });

            }}

            onContextMenu={(e) => {

                e.preventDefault();

                setContextMenu({
                    type: "ability",
                    x: e.clientX,
                    y: e.clientY,
                    abilityId: ability.id,
                    name: ability.name
                });

            }}

            className={`
                tree-file
                cursor-pointer

                ${
                    isOver ||
                    hoverTarget === `ability-${ability.id}`
                        ? "bg-primary/10"
                        : ""
                }
            `}
        >
            {ability.name}
        </div>

    );

}