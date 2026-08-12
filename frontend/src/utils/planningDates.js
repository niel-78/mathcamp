export function getCurrentWeek() {

    return getWeekNumber(
        new Date()
    );

}

export function getWeekNumber(
    dateString
) {

    const date =
        new Date(dateString);

    const target =
        new Date(date.valueOf());

    const dayNr =
        (
            date.getDay() + 6
        ) % 7;

    target.setDate(
        target.getDate()
        - dayNr
        + 3
    );

    const firstThursday =
        new Date(
            target.getFullYear(),
            0,
            4
        );

    const diff =
        target - firstThursday;

    return (
        1 +
        Math.round(
            diff / 604800000
        )
    );

}

export function groupLessonsByWeek(
    lessons
) {

    const grouped = {};

    lessons.forEach(
        lesson => {

            const week =
                getWeekNumber(
                    lesson.starts_at
                );

            if (!grouped[week]) {
                grouped[week] = [];
            }

            grouped[week].push(
                lesson
            );

        }
    );

    return grouped;

}

export function getWeekdayIndex(
    dateString
) {

    const day =
        new Date(dateString).getDay();

    return day === 0
        ? 6
        : day - 1;

}
