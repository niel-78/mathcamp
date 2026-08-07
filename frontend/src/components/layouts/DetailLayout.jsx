export default function DetailLayout({
    sidebar,
    children
}) {

    return (

        <div
            className="
                grid
                gap-6

                xl:grid-cols-[2fr_1fr]
            "
        >

            <div
                className="
                    space-y-6
                "
            >
                {children}
            </div>

            <div
                className="
                    space-y-6
                "
            >
                {sidebar}
            </div>

        </div>

    );

}