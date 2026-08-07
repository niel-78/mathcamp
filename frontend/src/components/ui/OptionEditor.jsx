import { Button }
    from "@/components/ui/button";

import { Input }
    from "@/components/ui/input";

import MathContent
    from "@/components/ui/MathContent";

export default function OptionEditor({
    text,
    isCorrect,
    onTextChange,
    onCorrectChange,
    onSave,
    onCancel
}) {

    return (

        <div
            className="
                card
                space-y-4
            "
        >

            <label
                className="
                    flex
                    items-center
                    gap-2
                "
            >

                <input
                    type="checkbox"
                    checked={isCorrect}
                    onChange={(e) =>
                        onCorrectChange(
                            e.target.checked
                        )
                    }
                />

                Rätt svar

            </label>

            <div
                className="
                    math-preview
                "
            >

                <MathContent
                    value={text}
                />

            </div>

            <Input
                className="
                    input-standard
                    font-mono
                "
                value={text}
                onChange={(e) =>
                    onTextChange(
                        e.target.value
                    )
                }
            />

            <div
                className="
                    flex
                    justify-end
                    gap-2
                "
            >

                <Button
                    onClick={onSave}
                >
                    Spara
                </Button>

                <Button
                    variant="outline"
                    onClick={onCancel}
                >
                    Avbryt
                </Button>

            </div>

        </div>

    );

}