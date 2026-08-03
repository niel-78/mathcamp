import { useEffect, useState } from "react";

import { API_URL } from "@/config";

import CreateBlock from "@/components/ui/CreateBlock";
import BlockLibrary from "@/components/ui/BlockLibrary";

export default function SectionTab({
    sectionId,
    openTab,
    blockRefreshKey
}) {

    const [section, setSection] = useState(null);
    const [blocks, setBlocks] = useState([]);

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
            `${API_URL}/api/teacher/blocks/${blockId}/book-sections/${sectionId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        loadBlocks();

    };

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/sections/${sectionId}/blocks`
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

        <div className="p-6">

            <h1 className="text-3xl font-bold mb-2">
                {section.title}
            </h1>

            <div className="text-sm text-slate-500 mb-6">

                {section.chapter_number}
                {" "}
                {section.chapter_title}

                {" → "}

                {section.subchapter_number}
                {" "}
                {section.subchapter_title}

            </div>

            <CreateBlock
                sectionIds={[sectionId]}
                onCreated={loadBlocks}
            />

            <BlockLibrary
                blocks={blocks}
                openTab={openTab}
                onReload={loadBlocks}
                onDelete={removeBlock}
            />

        </div>

    );

}