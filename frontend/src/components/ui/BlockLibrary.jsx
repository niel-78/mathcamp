import BlockCard from "@/components/ui/BlockCard";

export default function BlockLibrary({
    blocks,
    openTab,
    onDelete,
}) {

    if (!blocks?.length) {
        return (
            <p>
                Inga block hittades.
            </p>
        );
    }

    return (
        <div
            className="
                grid
                gap-4
                grid-cols-1
                md:grid-cols-2
                xl:grid-cols-3
            "
        >
            {blocks.map(block => (
                <BlockCard
                    key={block.id}
                    block={block}
                    openTab={openTab}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}