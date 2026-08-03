import BlockCard from "@/components/ui/BlockCard";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function BlockLibrary({
    blocks,
    openTab,
    onDelete,
    onReload
}) {

    const removeCentralContent = async (
        blockId,
        centralContentId,
    ) => {

        await fetch(
            `${API_URL}/api/blocks/${blockId}/central-content/${centralContentId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        onReload();

    };

    const removeSection = async (
        blockId,
        sectionId
    ) => {

        await fetch(
            `${API_URL}/api/blocks/${blockId}/book-sections/${sectionId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        onReload();

    };


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
                    dragPrefix="library"
                    block={block}
                    openTab={openTab}
                    onDelete={onDelete}
                    onRemoveSection={removeSection}
                    onRemoveCentralContent={removeCentralContent}
                />
            ))}
        </div>
    );
}