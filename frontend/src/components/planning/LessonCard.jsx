import CardSection from "@/components/layouts/CardSection";
import DropZone from "@/components/ui/DropZone";
import FormatDateTimeShort from "@/utils/FormatDateTimeShort";
import LessonSection from "./LessonSection";

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

                            <LessonSection
                                key={`${lesson.id}-${section.id}`}
                                section={section}
                                lessonId={lesson.id}
                            />

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