import MathContent from "@/components/ui/MathContent";

export default function MathPreview({
    value
}) {

    const text =
        typeof value === "string"
            ? value.trim()
            : "";

    const looksLikeMath =
        text.includes("\\") ||
        text.includes("$") ||
        text.includes("^") ||
        text.includes("_") ||
        text.includes("=") ||
        /\d+\/\d+/.test(text);

    if (!looksLikeMath) {
        return null;
    }

    return (
        <div className="mt-2 p-3 rounded border bg-muted">
            <MathContent value={value} />
        </div>
    );
}