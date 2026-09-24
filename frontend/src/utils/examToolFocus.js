export const examToolWindowAttribute = "data-exam-tool-window";

export function isFocusInsideExamTool() {
    return Boolean(
        document.activeElement?.closest?.(`[${examToolWindowAttribute}]`)
    );
}
