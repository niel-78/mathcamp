import { useRef, useState } from "react";
import { evaluate } from "mathjs";
import Draggable from "react-draggable";
import { Calculator as CalculatorIcon, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

const calculatorKeys = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ",", "", "+"]
];

const calculatorPositionStorageKey = "math-camp-calculator-position";

function getSavedPosition() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(calculatorPositionStorageKey) || "null"
        );

        if (
            Number.isFinite(saved?.x) &&
            Number.isFinite(saved?.y)
        ) {
            return {
                x: saved.x,
                y: saved.y
            };
        }
    } catch {
        // Use the default position when localStorage is unavailable or invalid.
    }

    return {
        x: 0,
        y: 0
    };
}

function formatResult(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(Number(value.toFixed(12)).toString()).replace(".", ",");
    }

    return String(value).replace(".", ",");
}

export default function Calculator() {
    const calculatorRef = useRef(null);
    const savedPosition = useRef(getSavedPosition());
    const [open, setOpen] = useState(false);
    const [expression, setExpression] = useState("");
    const [result, setResult] = useState("");

    const append = (value) => {
        setExpression(current => `${current}${value}`);
        setResult("");
    };

    const calculate = () => {
        if (!expression.trim() || !/^[0-9+\-*/(),\s]+$/.test(expression)) {
            setResult("Ogiltigt uttryck");
            return;
        }

        try {
            setResult(
                formatResult(
                    evaluate(expression.replaceAll(",", "."))
                )
            );
        } catch {
            setResult("Ogiltigt uttryck");
        }
    };

    const clear = () => {
        setExpression("");
        setResult("");
    };

    const removeLast = () => {
        setExpression(current => current.slice(0, -1));
        setResult("");
    };

    return (
        <div className="relative flex flex-col items-end gap-2">
            <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(current => !current)}
                aria-expanded={open}
            >
                <CalculatorIcon />
                Miniräknare
            </Button>

            {open && (
                <Draggable
                    handle=".calculator-drag-handle"
                    nodeRef={calculatorRef}
                    defaultPosition={savedPosition.current}
                    onStop={(_event, data) => {
                        savedPosition.current = {
                            x: data.x,
                            y: data.y
                        };

                        localStorage.setItem(
                            calculatorPositionStorageKey,
                            JSON.stringify(savedPosition.current)
                        );
                    }}
                >
                    <section
                        ref={calculatorRef}
                        aria-label="Miniräknare"
                        className="absolute right-0 top-full z-[100] mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border bg-muted/20 p-3 shadow-lg"
                    >
                        <div className="calculator-drag-handle mb-3 cursor-move select-none rounded-md border bg-background px-3 py-2 text-right">
                            <div className="text-xs font-medium text-muted-foreground">
                                Miniräknare
                            </div>
                            <div className="min-h-5 break-all text-sm text-muted-foreground">
                                {expression || "0"}
                            </div>
                            <div className="min-h-7 break-all text-xl font-semibold">
                                {result}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {calculatorKeys.flat().map((key, index) => (
                                key ? (
                                    <Button
                                        key={key}
                                        type="button"
                                        variant="outline"
                                        className="h-9"
                                        onClick={() => append(key)}
                                    >
                                        {key}
                                    </Button>
                                ) : (
                                    <div key={`empty-${index}`} />
                                )
                            ))}
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-9"
                                onClick={clear}
                            >
                                C
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-9"
                                onClick={removeLast}
                                aria-label="Ta bort sista tecknet"
                            >
                                <Delete />
                            </Button>
                            <Button
                                type="button"
                                className="col-span-2 h-9"
                                onClick={calculate}
                            >
                                =
                            </Button>
                        </div>
                    </section>
                </Draggable>
            )}
        </div>
    );
}
