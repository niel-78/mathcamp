import BlockCard from "@/components/ui/BlockCard";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import CardSection from "@/components/layouts/CardSection";
import CardGridLayout from "@/components/layouts/CardGridLayout";

export default function BlockLibrary({
    blocks,
    openTab,
    onDelete,
    onReload,
    dragPrefix
}) {


    const copyBlock = async (
        blockId
    ) => {

        const response =
            await fetch(
                `${API_URL}/api/blocks/${blockId}/copy`,
                {
                    method: "POST",
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        onReload();

    };

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


    const myBlocks =
        blocks.filter(
            block =>
                block.category === "mine"
        );

    const schoolBlocks =
        blocks.filter(
            block =>
                block.category === "school"
        );

    const globalBlocks =
        blocks.filter(
            block =>
                block.category === "global"
        );

    const renderBlocks = (
        items
    ) => (

        <CardGridLayout
            pageSize={12}
            minCardWidth={500}
        >

            {items.map(block => (

                <BlockCard
                    key={block.id}
                    dragPrefix={dragPrefix}
                    block={block}
                    openTab={openTab}
                    onDelete={onDelete}
                    onRemoveSection={
                        removeSection
                    }
                    onRemoveCentralContent={
                        removeCentralContent
                    }
                    onCopy={copyBlock}
                />

            ))}

        </CardGridLayout>

    );


    if (!blocks?.length) {
        return (
            <p>
                Inga block hittades.
            </p>
        );
    }

    return (

        <>
            <CardSection
                title="Mina block"
            >

                {renderBlocks(myBlocks)}

            </CardSection>

            <CardSection
                title="Skolans block"
            >

                {renderBlocks(
                    schoolBlocks
                )}

            </CardSection>

            <CardSection
                title="Globala block"
            >

                {renderBlocks(
                    globalBlocks
                )}

            </CardSection>
        </>

    );
}
