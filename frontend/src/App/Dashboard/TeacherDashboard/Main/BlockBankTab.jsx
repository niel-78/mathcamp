import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { TabSectionRow } from "@/components/layouts/TabSectionRow";
import { TabSection } from "@/components/layouts/TabSection";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import BlockLibrary from "@/components/ui/BlockLibrary";
import CentralContentFilter from "@/components/ui/CentralContentFilter";
import BookSectionFilter from "@/components/ui/BookSectionFilter";
import DeleteBlockDialog from "@/components/ui/DeleteBlockDialog";


export default function BlockBankTab({
    openTab,
    blockRefreshKey
}) {

    const [blocks, setBlocks] = useState([]);
    const [blockToDelete, setBlockToDelete] = useState(null);

    const [centralContentId,
        setCentralContentId] =
        useState("");

    const [sectionId,
        setSectionId] =
        useState("");


    useEffect(() => {
        loadBlocks();
    }, [blockRefreshKey]);

    const [
        createBlockOpen,
        setCreateBlockOpen
    ] = useState(false);

    const loadBlocks = async () => {

        const res = await fetch(
            `${API_URL}/api/blocks/`,
            {
                headers: authHeaders()
            }
        );

        const data = await res.json();
        setBlocks(data);

    };


    const deleteBlock = async () => {

        await fetch(
            `${API_URL}/api/blocks/${blockToDelete}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        setBlockToDelete(null);

        loadBlocks();

    };


    const filteredBlocks =
        blocks.filter(block => {

        const matchesCC =

            !centralContentId ||

            block.centralContent?.some(
                cc =>
                    cc.id ===
                    Number(
                        centralContentId
                    )
            );

        const matchesSection =

            !sectionId ||

            block.bookSections?.some(
                section =>
                    section.id ===
                    Number(sectionId)
            );

        return (
            matchesCC &&
            matchesSection
        );

    });  

    return (
        <>

            <BaseTabLayout

                title="Blockbank"

                actions={

                    <Button
                        onClick={() =>
                            setCreateBlockOpen(
                                true
                            )
                        }
                    >
                        Skapa eget block
                    </Button>

                }

            >

                <TabSectionRow>

                    <TabSection
                        title="
                            Centralt innehåll
                        "
                    >

                        <CentralContentFilter
                            centralContentId={
                                centralContentId
                            }
                            onCentralContentChange={
                                setCentralContentId
                            }
                        />

                    </TabSection>

                    <TabSection
                        title="
                            Boksektion
                        "
                    >

                        <BookSectionFilter
                            sectionId={sectionId}
                            onSectionChange={
                                setSectionId
                            }
                        />

                    </TabSection>

                </TabSectionRow>

                <BlockLibrary
                    blocks={filteredBlocks}
                    openTab={openTab}
                    onDelete={setBlockToDelete}
                    onReload={loadBlocks}
                />

                <DeleteBlockDialog
                    open={blockToDelete !== null}
                    onOpenChange={(open) => {

                        if (!open) {
                            setBlockToDelete(null);
                        }

                    }}
                    onDelete={deleteBlock}
                />

            </BaseTabLayout>

            <CreateBlockDialog
                open={createBlockOpen}
                onOpenChange={
                    setCreateBlockOpen
                }
                onCreated={loadBlocks}
            />      

        </>
    );
}