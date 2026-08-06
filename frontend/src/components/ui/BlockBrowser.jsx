import { useEffect, useMemo, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import MathContent from "@/components/ui/MathContent";

export default function BlockBrowser({
    selectable = false,
    selectedBlocks = [],
    onSelectionChange,
    openTab
}) {

    const [blocks, setBlocks] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [
        selectedCentralContent,
        setSelectedCentralContent
    ] = useState([]);

    const [
        selectedSections,
        setSelectedSections
    ] = useState([]);

    useEffect(() => {

        const loadBlocks = async () => {

            const response = await fetch(
                `${API_URL}/api/blocks`,
                {
                    headers: authHeaders()
                }
            );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            setBlocks(data);

        };

        loadBlocks();

    }, []);

    const centralContent =
        useMemo(() => {

            const map =
                new Map();

            blocks.forEach(block => {

                block.central_content?.forEach(
                    item => {

                        map.set(
                            item.id,
                            item
                        );

                    }
                );

            });

            return [...map.values()];

        }, [blocks]);

    const sections =
        useMemo(() => {

            const map =
                new Map();

            blocks.forEach(block => {

                block.sections?.forEach(
                    section => {

                        map.set(
                            section.id,
                            section
                        );

                    }
                );

            });

            return [...map.values()];

        }, [blocks]);

    const filteredBlocks =
        useMemo(() => {

            return blocks.filter(
                block => {

                    const matchesSearch =

                        search === "" ||

                        (block.name ?? "")

                            .toLowerCase()

                            .includes(
                                search.toLowerCase()
                            );

                    const matchesCC =

                        selectedCentralContent.length === 0 ||

                        block.central_content?.some(
                            cc =>
                                selectedCentralContent.includes(
                                    cc.id
                                )
                        );

                    const matchesSection =

                        selectedSections.length === 0 ||

                        block.sections?.some(
                            section =>
                                selectedSections.includes(
                                    section.id
                                )
                        );

                    return (
                        matchesSearch &&
                        matchesCC &&
                        matchesSection
                    );

                }
            );

        }, [
            blocks,
            search,
            selectedCentralContent,
            selectedSections
        ]);

    const toggleBlock = (
        blockId
    ) => {

        if (!selectable) {
            return;
        }

        const exists =
            selectedBlocks.includes(
                blockId
            );

        if (exists) {

            onSelectionChange(
                selectedBlocks.filter(
                    id =>
                        id !== blockId
                )
            );

        } else {

            onSelectionChange([
                ...selectedBlocks,
                blockId
            ]);

        }

    };

    const handleBlockClick =
        (block) => {

            if (selectable) {

                toggleBlock(
                    block.id
                );

                return;

            }

            openTab?.({
                id: `block-${block.id}`,
                type: "block",
                title:
                    block.name ??
                    `Block ${block.id}`,
                block
            });

        };

    return (

        <div
            className="
                grid
                grid-cols-12
                gap-4
                h-full
            "
        >

            <div
                className="
                    col-span-3
                    overflow-auto
                    pr-4
                    border-r
                "
            >

                <input
                    className="
                        input-standard
                        mb-4
                    "
                    placeholder="Sök block..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                />

                <h3
                    className="
                        font-medium
                        mb-2
                    "
                >
                    Centralt innehåll
                </h3>

                {centralContent.map(
                    item => (

                        <label
                            key={item.id}
                            className="
                                flex
                                gap-2
                                mb-1
                            "
                        >

                            <input
                                type="checkbox"
                                checked={
                                    selectedCentralContent.includes(
                                        item.id
                                    )
                                }
                                onChange={() => {

                                    setSelectedCentralContent(
                                        prev =>

                                            prev.includes(
                                                item.id
                                            )

                                                ? prev.filter(
                                                    id =>
                                                        id !== item.id
                                                )

                                                : [
                                                    ...prev,
                                                    item.id
                                                ]

                                    );

                                }}
                            />

                            {item.name}

                        </label>

                    )
                )}

                <h3
                    className="
                        font-medium
                        mt-6
                        mb-2
                    "
                >
                    Boksektioner
                </h3>

                {sections.map(
                    section => (

                        <label
                            key={section.id}
                            className="
                                flex
                                gap-2
                                mb-1
                            "
                        >

                            <input
                                type="checkbox"
                                checked={
                                    selectedSections.includes(
                                        section.id
                                    )
                                }
                                onChange={() => {

                                    setSelectedSections(
                                        prev =>

                                            prev.includes(
                                                section.id
                                            )

                                                ? prev.filter(
                                                    id =>
                                                        id !== section.id
                                                )

                                                : [
                                                    ...prev,
                                                    section.id
                                                ]

                                    );

                                }}
                            />

                            {section.name}

                        </label>

                    )
                )}

            </div>

            <div
                className="
                    col-span-9
                    overflow-auto
                "
            >

                <div
                    className="
                        grid
                        gap-3
                    "
                >

                    {filteredBlocks.map(
                        block => (

                            <div
                                key={block.id}
                                onClick={() =>
                                    handleBlockClick(
                                        block
                                    )
                                }
                                className={`
                                    card

                                    ${
                                        selectable
                                            ? "cursor-pointer"
                                            : ""
                                    }

                                    ${
                                        selectedBlocks.includes(
                                            block.id
                                        )
                                            ?   `
                                                ring-2
                                                ring-primary
                                            `
                                            : ""
                                    }
                                `}
                            >

                                <h3
                                    className="
                                        font-medium
                                    "
                                >
                                    <MathContent value={block.questions[0].question ??
                                        `Block ${block.id}`}></MathContent>
                                </h3>

                                <p
                                    className="
                                        text-sm
                                        text-muted-foreground
                                    "
                                >
                                    {
                                        block.questions?.length ??
                                        0
                                    }
                                    {" "}
                                    frågor
                                </p>

                            </div>

                        )
                    )}

                </div>

            </div>

        </div>

    );

}