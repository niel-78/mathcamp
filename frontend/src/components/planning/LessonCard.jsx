import CardSection from "@/components/layouts/CardSection";
import DropZone from "@/components/ui/DropZone";
import FormatDateTimeShort from "@/utils/formatDateTimeShort";
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
    showGroupName = true,
    onEditLesson,
    onCancelLesson,
    onDeleteLesson,
    readOnly = false
}) {

    if (lesson.cancelled_by_exception) {

        return (

            <CardSection
                title={
                    <div
                        className="
                            // text-sm
                            // text-muted-foreground
                        "
                    >
                        <FormatDateTimeShort
                            value={lesson.starts_at}
                            showDate={false}
                        />

                        {" - "}

                        <FormatDateTimeShort
                            value={lesson.ends_at}
                            showDate={false}
                        />

                    </div>
                }
            >

                <div
                    className="
                        rounded-md
                        border
                        border-destructive
                        bg-destructive/10
                        p-4
                    "
                >

                    <div
                        className="
                            font-semibold
                            text-destructive
                        "
                    >
                        Undervisningen utgår
                    </div>

                    <div className="mt-1">
                        {lesson.schedule_exception_title}
                    </div>

                    {lesson.schedule_exception_note && (
                        <div
                            className="
                                mt-1
                                text-sm
                                text-muted-foreground
                            "
                        >
                            {lesson.schedule_exception_note}
                        </div>
                    )}

                </div>

            </CardSection>

        );

    }

    return(
        <CardSection
            title={
                    <div
                        className="
                            // text-sm
                            // text-muted-foreground
                        "
                    >
                        <FormatDateTimeShort
                            value={lesson.starts_at}
                            showDate={false}
                        />

                        {" - "}

                        <FormatDateTimeShort
                            value={lesson.ends_at}
                            showDate={false}
                        />

                    </div>
            }
            actions={
                !readOnly && (
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
                )    
            }
        >

            <div className="space-y-4">

                <div>

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

                {lesson.schedule_exception_id &&
                !lesson.cancelled_by_exception && (

                    <div
                        className="
                            rounded-md
                            border
                            border-green-500
                            bg-green-50
                            p-3
                        "
                    >

                        <div
                            className="
                                font-medium
                                text-green-700
                            "
                        >
                            {lesson.schedule_exception_title}
                        </div>

                        {lesson.schedule_exception_note && (
                            <div
                                className="
                                    mt-1
                                    text-sm
                                    text-green-600
                                "
                            >
                                {lesson.schedule_exception_note}
                            </div>
                        )}

                    </div>

                )}

                {lesson.description && (

                    <div
                        className="
                            rounded-md
                            border
                            bg-muted/30
                            p-3
                            text-sm
                            whitespace-pre-wrap
                        "
                    >
                        {lesson.description}
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

                {!readOnly && (
                    <DropZone
                        id={`lesson-${lesson.id}`}
                        readOnly={readOnly}
                        text="Släpp sektion här"
                        className="min-h-[100px]"
                    />
                )}    

            </div>

        </CardSection>

    );

}