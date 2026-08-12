import LessonCard from "./LessonCard";

export default function ListView({
    lessons
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
                    />

                )
            )}

        </div>

    );

}
