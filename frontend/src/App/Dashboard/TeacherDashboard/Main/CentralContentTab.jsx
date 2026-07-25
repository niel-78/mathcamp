import { useEffect, useState } from "react";
import { API_URL } from "@/config";

export default function CentralContentTab({
    centralContentId,
    centralContentTitle,
    levelCode
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
                        className="border rounded p-4"
                    >

                        <h3 className="font-semibold mb-3">
                            {block.name}
                        </h3>

                        <div className="space-y-2">

                            {block.questions?.map(
                                question => (

                                    <div
                                        key={question.id}
                                        className="
                                            border
                                            rounded
                                            p-2
                                        "
                                    >
                                        {
                                            question.question_text
                                        }
                                    </div>

                                )
                            )}

                        </div>

                    </div>

                ))}

            </div>
        </div>    

    );

}