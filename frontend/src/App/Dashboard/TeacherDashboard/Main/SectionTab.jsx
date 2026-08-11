import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import BlockLibrary from "@/components/ui/BlockLibrary";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { Button } from "@/components/ui/button";
import DropZone from "@/components/ui/DropZone";

export default function SectionTab({
    sectionId,
    openTab,
    blockRefreshKey
}) {

    const [section, setSection] = useState(null);
    const [blocks, setBlocks] = useState([]);

    const [
        createBlockOpen,
        setCreateBlockOpen
    ] = useState(false);

    useEffect(() => {

        loadSection();
        loadBlocks();

    }, [sectionId,blockRefreshKey]);

    const loadSection = async () => {

        const response = await fetch(
            `${API_URL}/api/books/sections/${sectionId}`
        );

        const data =
            await response.json();

        setSection(data);

    };

    const removeBlock = async (blockId) => {

        await fetch(
            `${API_URL}/api/blocks/${blockId}/book-sections/${sectionId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        loadBlocks();

    };

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/blocks/sections/${sectionId}`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {

            const text = await response.text();

            console.error(text);

            return;

        }

        const data = await response.json();

        setBlocks(data);

    };

    if (!section) {

        return (
            <div className="p-6">
                Laddar...
            </div>
        );

    }

    return (

        <>
            <BaseTabLayout

                title={`${section.chapter_number}. ${section.chapter_title} > ${section.subchapter_number} > ${section.subchapter_title}`}

                actions={

                    <Button
                        onClick={() =>
                            setCreateBlockOpen(true)
                        }
                    >
                        Skapa eget block
                    </Button>

                }

            >
                
                <DropZone
                    id={`section-${sectionId}`}
                    text="
                    Dra block hit för att koppla dem
                    till denna boksektion
                "
                />
                
                
                <BlockLibrary
                    blocks={blocks}
                    dragPrefix="section"
                    openTab={openTab}
                    onReload={loadBlocks}
                    onDelete={removeBlock}
                />

            </BaseTabLayout>
            <CreateBlockDialog
                open={createBlockOpen}
                onOpenChange={setCreateBlockOpen}
                sectionIds={[sectionId]}
                onCreated={loadBlocks}
            />
        </>    

    );

}