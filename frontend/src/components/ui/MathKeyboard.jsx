import { Delete, RotateCcw } from "lucide-react";

const rows = [
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "−"],
    ["0", ",", ".", "+"],
    ["(", ")", "=", "√"],
    ["π", "²", "³", "/"]
];

function insertAtCursor(input, value, insertion) {
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;

    return {
        text: `${value.slice(0, start)}${insertion}${value.slice(end)}`,
        cursor: start + insertion.length
    };
}

export default function MathKeyboard({ value = "", inputRef, onChange }) {
    const pressKey = key => {
        const insertion = {
            "÷": "/",
            "×": "*",
            "−": "-",
            "√": "\\sqrt{}",
            "π": "\\pi",
            "²": "^2",
            "³": "^3"
        }[key] || key;
        const result = insertAtCursor(inputRef?.current, value, insertion);

        onChange(result.text);
        requestAnimationFrame(() => {
            inputRef?.current?.focus();
            inputRef?.current?.setSelectionRange(result.cursor, result.cursor);
        });
    };

    const removeCharacter = () => {
        const input = inputRef?.current;
        const start = input?.selectionStart ?? value.length;
        const end = input?.selectionEnd ?? start;
        const deleteStart = start === end ? Math.max(0, start - 1) : start;
        const nextValue = `${value.slice(0, deleteStart)}${value.slice(end)}`;

        onChange(nextValue);
        requestAnimationFrame(() => {
            inputRef?.current?.focus();
            inputRef?.current?.setSelectionRange(deleteStart, deleteStart);
        });
    };

    return (
        <div className="mt-3 w-full max-w-sm rounded-xl border bg-muted/40 p-2 sm:hidden">
            <div className="mb-2 flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
                <span>Matematiskt tangentbord</span>
                <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background"
                    onPointerDown={event => event.preventDefault()}
                    onClick={() => onChange("")}
                    aria-label="Rensa svar"
                    title="Rensa svar"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
                {rows.flat().map(key => (
                    <button
                        key={key}
                        type="button"
                        className="h-10 rounded-lg border bg-background text-base font-medium shadow-sm active:bg-accent"
                        onPointerDown={event => event.preventDefault()}
                        onClick={() => pressKey(key)}
                    >
                        {key}
                    </button>
                ))}
                <button
                    type="button"
                    className="col-span-4 inline-flex h-10 items-center justify-center rounded-lg border bg-background shadow-sm active:bg-accent"
                    onPointerDown={event => event.preventDefault()}
                    onClick={removeCharacter}
                    aria-label="Ta bort senaste tecknet"
                    title="Ta bort senaste tecknet"
                >
                    <Delete className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}