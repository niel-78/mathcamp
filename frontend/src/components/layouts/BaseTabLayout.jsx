export default function BaseTabLayout({
    title,
    actions,
    children
}) {

    return (

        <div
            className="
                h-full
                flex
                flex-col

                bg-background
                text-foreground

                border
                border-border

                rounded-b-lg
                overflow-hidden
            "
        >

            <div
                className="
                    px-4
                    py-3

                    bg-card
                    border-b
                    border-border

                    flex
                    items-center
                    justify-between

                    shrink-0
                "
            >

                <h1
                    className="
                        text-lg
                        font-semibold
                    "
                >
                    {title}
                </h1>

                {actions}

            </div>

            <div
                className="
                    flex-1
                    overflow-auto
                    p-4
                "
            >
                {children}
            </div>

        </div>

    );

}