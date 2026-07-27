import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BlockEditor from "@/components/ui/BlockEditor";

export default function BlockLibrary() {

    const [blocks, setBlocks] = useState([]);

    useEffect(() => {
        loadBlocks();
    }, []);

    const loadBlocks = async () => {

        const res = await fetch(
            `${API_URL}/api/teacher/blocks/full`,
            {
                headers: authHeaders()
            }
        );

        const data = await res.json();

        setBlocks(data);
    };

    return (
        <>
            <h2>Frågebank</h2>

            {blocks.map(block => (
                <BlockEditor
                    key={block.id}
                    block={block}
                    onChanged={loadBlocks}
                />
            ))}
        </>
    );
}
