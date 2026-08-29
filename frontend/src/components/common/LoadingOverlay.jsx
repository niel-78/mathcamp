import { Loader2 } from "lucide-react";

export default function LoadingOverlay({
    text = "Laddar..."
}) {

    return (

        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-black/20
                backdrop-blur-sm
            "
        >

            <div
                className="
                    flex
                    items-center
                    gap-3
                    rounded-lg
                    bg-background
                    p-6
                    shadow-lg
                "
            >

                <Loader2
                    className="
                        h-6
                        w-6
                        animate-spin
                    "
                />

                <span>
                    {text}
                </span>

            </div>

        </div>

    );

}