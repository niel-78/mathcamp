export default function FormatDateTimeShort({
    value
}) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    return (
        <>
            {date.toLocaleString(
                "sv-SE",
                {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )}
        </>
    );

}