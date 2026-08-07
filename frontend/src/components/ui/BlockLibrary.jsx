import BlockCard from "@/components/ui/BlockCard";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import CardSection from "@/components/layouts/CardSection";
import CardGridLayout from "@/components/layouts/CardGridLayout";

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

        <CardSection
            title="Uppgiftsbank"
            description="
                Alla tillgängliga uppgiftsblock.
            "
        >

            <CardGridLayout
                pageSize={12}
                minCardWidth={500}
            >

                {blocks.map(block => (

                    <BlockCard
                        key={block.id}
                        dragPrefix="library"
                        block={block}
                        openTab={openTab}
                        onDelete={onDelete}
                        onRemoveSection={
                            removeSection
                        }
                        onRemoveCentralContent={
                            removeCentralContent
                        }
                    />

                ))}

            </CardGridLayout>

        </CardSection>
    );
}
