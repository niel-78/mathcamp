import MathContent
    from "@/components/ui/MathContent";

import { Button }
    from "@/components/ui/button";

export default function OptionCard({
    option,
    onEdit,
    onDelete
}) {

    return (

        <div
            className="
                card
                space-y-4
            "
        >

            <div
                className="
                    flex
                    items-start
                    justify-between
                    gap-4
                "
            >

                <MathContent
                    value={option.text}
                />

                {option.is_correct ? (

                    <span
                        className="
                            rounded-full
                            px-2
                            py-1

                            text-xs
                            font-medium

                            bg-green-500/10
                            text-green-600

                            shrink-0
                        "
                    >
                        Korrekt
                    </span>

                ) : (

                    <span
                        className="
                            rounded-full
                            px-2
                            py-1

                            text-xs
                            font-medium

                            bg-red-500/10
                            text-red-600

                            shrink-0
                        "
                    >
                        Felaktigt
                    </span>

                )}

            </div>

            <div
                className="
                    flex
                    justify-end
                    gap-2
                "
            >

                <Button
                    variant="outline"
                    onClick={() =>
                        onEdit(option)
                    }
                >
                    Redigera
                </Button>

                <Button
                    variant="destructive"
                    onClick={() =>
                        onDelete(option)
                    }
                >
                    Ta bort
                </Button>

            </div>

        </div>

    );

}