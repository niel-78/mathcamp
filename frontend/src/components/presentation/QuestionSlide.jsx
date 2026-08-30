import MathContent from "@/components/ui/MathContent";

export default function QuestionSlide({
    slide,
    isFullscreen
}) {

    return (

        <div
            className="
                h-full
                flex
                flex-col
                gap-10
            "
        >

            <h1
                className="
                    text-4xl
                    font-bold
                "
            >
                {slide.title || "Exempel"}
            </h1>

            <div
                className="
                    rounded-xl
                    border
                    p-6
                    text-2xl
                "
            >
                <MathContent
                    value={slide.question}
                />
            </div>

            {isFullscreen && (

                <div
                    className="
                        bg-white
                        rounded-xl
                        border-2
                        border-gray-300
                        overflow-hidden
                        max-w-4xl
                    "
                >

                    {[1, 2, 3, 4, 5].map(row => (

                        <div
                            key={row}
                            className="
                                h-12
                                border-b
                                border-gray-200
                                last:border-b-0
                            "
                        />

                    ))}

                </div>

            )}

        </div>

    );

}