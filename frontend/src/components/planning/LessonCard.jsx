import CardSection from "@/components/layouts/CardSection";
import DropZone from "@/components/ui/DropZone";
import FormatDateTimeShort from "@/utils/FormatDateTimeShort";
import LessonSection from "./LessonSection";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { MoreVertical } from "lucide-react";

export default function LessonCard({
    lesson,
    showGroupName = false,
    onEditLesson,
    onCancelLesson,
    onDeleteLesson
}) {
    return (

        <CardSection
            title={
                <FormatDateTimeShort
                    value={lesson.starts_at}
                />
            }
            actions={
                <DropdownMenu>

                    <DropdownMenuTrigger
                        className="
                            inline-flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-md
                            hover:bg-accent
                        "
                    >

                        <MoreVertical size={16} />

                    </DropdownMenuTrigger>

                    <DropdownMenuContent>

                        <DropdownMenuItem
                            onClick={() =>
                                onEditLesson?.(lesson)
                            }
                        >
                            Redigera lektion
                        </DropdownMenuItem>

                        {lesson.cancelled_at ? (

                            <DropdownMenuItem
                                onClick={() =>
                                    onCancelLesson?.(
                                        lesson
                                    )
                                }
                            >
                                Återaktivera lektion
                            </DropdownMenuItem>

                        ) : (

                            <DropdownMenuItem
                                onClick={() =>
                                    onCancelLesson?.(
                                        lesson
                                    )
                                }
                            >
                                Ställ in lektion
                            </DropdownMenuItem>

                        )}

                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                                onDeleteLesson?.(lesson)
                            }
                        >
                            Ta bort lektion
                        </DropdownMenuItem>

                    </DropdownMenuContent>

                </DropdownMenu>
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

                    {lesson.classroom_name && (

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Klassrum: {lesson.classroom_name}
                        </div>

                    )}

                    {lesson.classroom_layout_name && (

                        <div
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Möblering: {lesson.classroom_layout_name}
                        </div>

                    )}

                </div>

                {lesson.cancelled_at && (

                    <div
                        className="
                            rounded-md
                            border
                            border-destructive
                            bg-destructive/10
                            p-2
                            text-sm
                        "
                    >
                        Lektionen är inställd
                    </div>

                )}

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