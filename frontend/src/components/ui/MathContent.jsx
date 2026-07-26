import { formatValue } from "@/utils/formatValue";

export default function MathContent({
    value,
    className = "",
}) {

    const text = value?.trim() ?? "";

    const containsMath =
        text.includes("\\") ||
        text.includes("$");

    const onlyMath =
        (
            text.startsWith("$") &&
            text.endsWith("$")
        ) ||
        (
            text.startsWith("$$") &&
            text.endsWith("$$")
        ) ||
        (
            text.startsWith("\\[") &&
            text.endsWith("\\]")
        );

    if (!containsMath) {

        return (
            <div className={className}>
                {text}
            </div>
        );

    }

    if (onlyMath) {

        return (
            <div
                className={`${className} text-center`}
                dangerouslySetInnerHTML={{
                    __html: formatValue(text)
                }}
            />
        );

    }

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{
                __html: formatValue(text)
            }}
        />
    );

}
