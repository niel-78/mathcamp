export default function FormatDate({ value }) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    return (
        <>
            {date.toLocaleString("sv-SE")}
        </>
    );
}