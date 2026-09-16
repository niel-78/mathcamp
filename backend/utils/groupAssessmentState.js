export function resolveGroupAssessmentLifecycleState(action) {
    switch (action) {
        case "open":
            return {
                status: "open",
                waiting_room_open: 1
            };

        case "close":
            return {
                status: "closed",
                waiting_room_open: 0
            };

        case "waiting":
            return {
                status: "waiting",
                waiting_room_open: 0
            };

        default:
            return {
                status: "waiting",
                waiting_room_open: 0
            };
    }
}
