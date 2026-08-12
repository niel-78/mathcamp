import CardSection
    from "@/components/layouts/CardSection";

import DropZone
    from "@/components/ui/DropZone";

import FormatDateTimeShort
    from "@/utils/FormatDateTimeShort";

export default function LessonCard({
    lesson,
    showGroupName = false
}) {

    return (

        <CardSection
            title={
                <FormatDateTimeShort
                    value={lesson.starts_at}
                />
            }
        >

            <div className="space-y-4">

                <div>

                    <div
                        className="
                            text-sm
                            text-muted-foreground
                        "
                    >
                        <FormatDateTimeShort
                            value={lesson.starts_at}
                        />

                        {" - "}

                        <FormatDateTimeShort
                            value={lesson.ends_at}
                        />
                    </div>

                    {showGroupName && (

                        <div
                            className="
                                mt-1
                                text-sm
                                text-muted-foreground
                            "
                        >
                            {lesson.group_name}
                        </div>

                    )}

                </div>

                <div className="space-y-2">

                    {lesson.sections?.map(
                        section => (

                            <div
                                key={section.id}
                                className="
                                    rounded-md
                                    border
                                    p-2
                                    bg-card
                                "
                            >

                                <div>
                                    {section.title}
                                </div>

                                <div
                                    className="
                                        text-xs
                                        text-muted-foreground
                                    "
                                >
                                    s.
                                    {section.page_number}

                                    {section.end_page >
                                    section.page_number
                                        ? `-${section.end_page}`
                                        : ""}
                                </div>

                            </div>

                        )
                    )}

                </div>

                <DropZone
                    id={`lesson-${lesson.id}`}
                    text="Släpp sektion här"
                    className="min-h-[100px]"
                />

            </div>

        </CardSection>

    );

}