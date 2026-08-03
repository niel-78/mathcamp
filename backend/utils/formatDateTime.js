export default function formatDateTime(value) {

    if (!value) {
        return null;
    }

    return value
        .replace("T", " ")
        .replace(".000Z", "");

}