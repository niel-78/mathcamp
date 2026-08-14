import {
    Card,
    CardContent
} from "@/components/ui/card";

export default function PresentationLibrary({
    presentations,
    openTab
}) {

    return (

        <div
            className="
                grid
                grid-cols-1
                md:grid-cols-2
                lg:grid-cols-3
                gap-4
            "
        >

            {presentations.map(
                presentation => (

                    <Card
                        key={
                            presentation.id
                        }
                        className="
                            cursor-pointer
                        "
                        onClick={() =>
                            openTab({

                                id:
                                    `presentation-${presentation.id}`,

                                title:
                                    presentation.title,

                                type:
                                    "presentation-editor",

                                presentation

                            })
                        }
                    >

                        <CardContent
                            className="p-4"
                        >

                            <h3
                                className="
                                    font-semibold
                                "
                            >
                                {
                                    presentation.title
                                }
                            </h3>

                            <p
                                className="
                                    text-sm
                                    text-muted-foreground
                                "
                            >
                                {
                                    presentation
                                        .section_title
                                    ||
                                    "Fristående presentation"
                                }
                            </p>

                        </CardContent>

                    </Card>

                )
            )}

        </div>

    );
}