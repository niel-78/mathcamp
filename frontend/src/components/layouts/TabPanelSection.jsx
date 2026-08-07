export default function TabPanelSection({
    title,
    description,
    children
}) {

    return (

        <div
            className="
                card
                mb-4
            "
        >

            <div
                className="
                    mb-4
                "
            >

                <h3
                    className="
                        text-sm
                        font-semibold
                    "
                >
                    {title}
                </h3>

                {description && (

                    <p
                        className="
                            text-sm
                            text-muted-foreground
                            mt-1
                        "
                    >
                        {description}
                    </p>

                )}

            </div>

            <div
                className="
                    flex
                    flex-col
                    gap-3
                "
            >
                {children}
            </div>

        </div>

    );

}