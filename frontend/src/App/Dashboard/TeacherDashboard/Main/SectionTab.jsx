import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import BlockLibrary from "@/components/ui/BlockLibrary";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { Button } from "@/components/ui/button";
import DropZone from "@/components/ui/DropZone";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import CreateBlockFromExcelDialog from "@/components/ui/CreateBlockFromExcelDialog";

export default function SectionTab({
    sectionId,
    openTab,
    blockRefreshKey
}) {

    const [section, setSection] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [createBlockOpen, setCreateBlockOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [loading, setLoading] = useState(true);


    useEffect(() => {

        loadSection();
        loadBlocks();

    }, [sectionId,blockRefreshKey]);

    const loadSection = async () => {

        setLoading(true);

        try {

            const response =
                await fetch(
                    `${API_URL}/api/books/sections/${sectionId}`
                );

            const data =
                await response.json();

            setSection(data);

        } finally {

            setLoading(false);

        }

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

    const createPresentation =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/books/sections/${sectionId}/open-presentation`,
                    {
                        method: "POST",
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {

                const error =
                    await response.json();

                console.error(error);

                return;

            }

            const data =
                await response.json();

            openTab({
                id:
                    `presentation-${data.presentation.id}`,
                title:
                    data.presentation.title,
                type:
                    "presentation-editor",
                presentation:
                    data.presentation
            });

        };

    const resetPresentation =
        async () => {

            const response =
                await fetch(
                    `${API_URL}/api/books/sections/${sectionId}/open-presentation`,
                    {
                        method: "POST",
                        headers: authHeaders()
                    }
                );

            if (!response.ok) {

                const error =
                    await response.json();

                console.error(error);

                return;

            }

            const data =
                await response.json();

            const resetResponse =
                await fetch(
                    `${API_URL}/api/presentations/${data.presentation.id}/reset`,
                    {
                        method: "POST",
                        headers: authHeaders()
                    }
                );

            if (!resetResponse.ok) {

                const error =
                    await resetResponse.json();

                console.error(error);

                return;

            }

            const resetData =
                await resetResponse.json();

            openTab({
                id:
                    `presentation-${resetData.presentation.id}`,
                title:
                    resetData.presentation.title,
                type:
                    "presentation-editor",
                presentation:
                    resetData.presentation
            });

        };

    if (loading || !section) {

        return <LoadingOverlay />;

    }

    return (

        <>
            <BaseTabLayout

                title={`${section.chapter_number}. ${section.chapter_title} > ${section.subchapter_number} > ${section.subchapter_title}`}

                actions={
                    <div className="flex gap-2">

                        <Button
                            variant="outline"
                            onClick={() =>
                                setImportOpen(true)
                            }
                        >
                            Skapa block från Excel
                        </Button>

                        <Button
                            onClick={() =>
                                setCreateBlockOpen(true)
                            }
                        >
                            Skapa eget block
                        </Button>
                        <Button
                            variant="outline"
                            onClick={createPresentation}
                            >
                            Öppna presentation
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={resetPresentation}
                        >
                            Återställ presentation
                        </Button>

                    </div>
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

            <CreateBlockFromExcelDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                sectionId={sectionId}
                onCreated={(block) => {

                    loadBlocks();

                    openTab({
                        id: `block-${block.id}`,
                        title: `Block #${block.id}`,
                        type: "block",
                        block
                    });

                    setImportOpen(false);

                }}
            />

        </>    

    );

}