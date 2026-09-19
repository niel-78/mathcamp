import { parseDatabaseDate } from "@/utils/parseDatabaseDate";

export default function FormatTime({
    value
}) {

    if (!value) {
        return "-";
    }

    const date = parseDatabaseDate(value);

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