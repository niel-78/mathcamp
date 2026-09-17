export function getSavedShowQuestionInfo(storage = localStorage) {
    try {
        const saved = storage.getItem("math-camp-show-question-info");

        if (saved === "true") {
            return true;
        }

        if (saved === "false") {
            return false;
        }
    } catch {
        // Use the default when storage is unavailable.
    }

    return false;
}
