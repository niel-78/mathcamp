export function parseEventData(
    eventData
) {

    try {

        return typeof eventData === "string"
            ? JSON.parse(eventData)
            : (
                eventData || {}
            );

    } catch {

        return {};

    }

}