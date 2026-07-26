import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import MathContent from "@/components/ui/MathContent";

export default function CentralContentTab({
    centralContentId,
    centralContentTitle,
    levelCode,
    openTab
}) {

    const [blocks, setBlocks] = useState([]);

    console.log("centralContentId", centralContentId);

    useEffect(() => {

        loadBlocks();

    }, [centralContentId]);

    const loadBlocks = async () => {

        const response = await fetch(
            `${API_URL}/api/central-content/${centralContentId}/blocks`,
            {
                headers: {
                    Authorization:
                        localStorage.getItem("token")
                }
            }
        );

        if (!response.ok) {

            const text = await response.text();

            console.error(text);

            return;

        }

        const data = await response.json();

        console.log(data);

        setBlocks(data);

    };

    console.log("blocks state", blocks);

    return (

        <div>

            <div className="mb-6">

                <h1 className="text-2xl font-bold">
                    {levelCode}
                </h1>

                <p className="text-muted-foreground mt-2">
                    {centralContentTitle}
                </p>

            </div>

            <div className="p-4 space-y-6">

                {blocks.map(block => (

                    <div
                        key={block.id}
                        className="
                            border
                            rounded
                            p-4
                            cursor-pointer
                            hover:bg-slate-50
                        "
                        onClick={() =>
                            openTab({
                                id: `block-${block.id}`,
                                type: "block",
                                title: block.name,
                                block: block
                            })
                        }
                    >

                        <h3 className="font-semibold mb-3">
                            {block.name}
                        </h3>

                        {block.questions?.length > 0 && (

                            <MathContent
                                value={block.questions[0].question}
                                className="p-2"
                            />

                        )}

                    </div>

                ))}

            </div>
        </div>    

    );

}