import LessonCard from "./LessonCard";

export default function ListView({
    lessons,
    readOnly = false,
    isPublic = false,
    hideCompletions = false
}) {

    const sortedLessons =
        [...lessons].sort(
            (a, b) =>
                new Date(a.starts_at) -
                new Date(b.starts_at)
        );

    return (

        <div className="space-y-4">

            {sortedLessons.map(
                lesson => (

                    <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        readOnly={readOnly}
                        isPublic={isPublic}
                        hideCompletions={hideCompletions}
                    />

                )
            )}

        </div>

    );

}
