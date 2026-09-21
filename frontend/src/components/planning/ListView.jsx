import { useEffect, useRef } from "react";
import LessonCard from "./LessonCard";

export default function ListView({
    lessons,
    openTab,
    onEditLesson,
    onCancelLesson,
    onDeleteLesson,
    startDiagnosticTest,
    readOnly = false,
    isPublic = false,
    hideCompletions = false
}) {
    const listRef = useRef(null);

    const sortedLessons =
        [...lessons].sort(
            (a, b) =>
                new Date(a.starts_at) -
                new Date(b.starts_at)
        );

    useEffect(() => {
        if (!listRef.current || sortedLessons.length === 0) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            const completedLesson = [...sortedLessons]
                .reverse()
                .find(lesson => !!lesson.ends_at && new Date(lesson.ends_at) < new Date());

            const targetSelector = completedLesson
                ? `[data-lesson-id="${completedLesson.id}"]`
                : ".card:last-of-type";

            const targetElement = listRef.current?.querySelector(targetSelector);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

        return () => cancelAnimationFrame(frame);
    }, [sortedLessons]);

    return (

        <div ref={listRef} className="space-y-4">

            {sortedLessons.map(
                lesson => (

                    <div
                        key={lesson.id}
                        data-lesson-id={lesson.id}
                    >
                        <LessonCard
                            lesson={lesson}
                            openTab={openTab}
                            onEditLesson={onEditLesson}
                            onCancelLesson={onCancelLesson}
                            onDeleteLesson={onDeleteLesson}
                            startDiagnosticTest={startDiagnosticTest}
                            readOnly={readOnly}
                            isPublic={isPublic}
                            hideCompletions={hideCompletions}
                            deferAssessments={true}
                        />
                    </div>

                )
            )}

        </div>

    );

}
