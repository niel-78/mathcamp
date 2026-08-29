export default function TitleSlide({
    slide
}) {

    return (

        <div
            className="
                h-full
                flex
                flex-col
                items-center
                justify-center
                text-center
                space-y-8
            "
        >

            <div
                className="
                    text-lg
                    text-muted-foreground
                "
            >
                {slide.book}
            </div>

            <h1
                className="
                    text-5xl
                    font-bold
                "
            >
                {slide.chapter}
            </h1>

            <div
                className="
                    text-3xl
                    font-medium
                "
            >
                {slide.subchapter}
            </div>

            <div
                className="
                    text-2xl
                    text-muted-foreground
                "
            >
                {slide.section}
            </div>

            {slide.startPage && (

                <div
                    className="
                        text-lg
                        text-muted-foreground
                    "
                >
                    Sidor {slide.startPage}
                    {slide.endPage &&
                        slide.endPage !== slide.startPage &&
                        `–${slide.endPage}`}
                </div>

            )}

        </div>

    );

}