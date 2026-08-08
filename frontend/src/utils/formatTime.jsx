export default function FormatTime({
    value
}) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    return (
        <>
            {date.toLocaleTimeString(
                "sv-SE",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            )}
        </>
    );

}