import { parseDatabaseDate } from "@/utils/parseDatabaseDate";

export default function FormatDateTimeShort({
    value,
    showDate = true
}) {

    if (!value) {
        return "-";
    }

    const date =
        parseDatabaseDate(value);

    return (
        <>
            {date.toLocaleString(
                "sv-SE",
                showDate
                    ? {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                      }
                    : {
                          hour: "2-digit",
                          minute: "2-digit"
                      }
            )}
        </>
    );

}