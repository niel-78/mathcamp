export default function GoalsSlide({
    slide
}) {
    return (
        <div
            className="
                h-full
                flex
                flex-col
                justify-center
                space-y-10
            "
        >

            <h1
                className="
                    text-5xl
                    font-bold
                    text-center
                "
            >
                {slide.title}
            </h1>

            <ul
                className="
                    text-3xl
                    space-y-6
                    max-w-3xl
                    mx-auto
                    list-disc
                "
            >
                {slide.abilities.map(
                    ability => (
                        <li key={ability}>
                            {ability}
                        </li>
                    )
                )}
            </ul>

        </div>
    );
}