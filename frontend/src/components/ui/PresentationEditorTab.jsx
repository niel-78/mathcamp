import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    useState
} from "react";

import BaseTabLayout
    from "@/components/layouts/BaseTabLayout";

import {
    Button
} from "@/components/ui/button";

export default function PresentationEditorTab({
    presentation,
    openTab
}) {

    const [
        title,
        setTitle
    ] = useState(
        presentation?.title || ""
    );

    const [
        content,
        setContent
    ] = useState(
        presentation?.content || ""
    );

    async function save() {

        await fetch(
            `${API_URL}/api/presentations/${presentation.id}`,
            {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    title,
                    content
                })
            }
        );

    }

    return (

        <BaseTabLayout

            title="Presentation"

            actions={
                <div className="flex gap-2">

                    <Button
                        onClick={save}
                    >
                        Spara
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() =>
                            openTab({

                                id:
                                    `presentation-player-${presentation.id}`,

                                title:
                                    `${title} (Visa)`,

                                type:
                                    "presentation-player",

                                presentationId:
                                    presentation.id

                            })
                        }
                    >
                        Visa
                    </Button>

                </div>
            }

        >

            <div className="space-y-4">

                <input
                    className="w-full border p-2"
                    value={title}
                    onChange={event =>
                        setTitle(
                            event.target.value
                        )
                    }
                />

                <textarea
                    className="
                        w-full
                        min-h-[600px]
                        border
                        p-4
                        font-mono
                    "
                    value={content}
                    onChange={event =>
                        setContent(
                            event.target.value
                        )
                    }
                />

            </div>

        </BaseTabLayout>

    );

}