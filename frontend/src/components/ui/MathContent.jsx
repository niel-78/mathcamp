import { formatMathText } from "@/utils/formatMathText";

export default function MathContent({
    value,
    className = ""
}) {
    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{
                __html: formatMathText(value)
            }}
        />
    );
}