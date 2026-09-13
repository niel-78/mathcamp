import CardGridLayout from "@/components/layouts/CardGridLayout";

export default function CardSection({
    title,
    description,
    actions,
    children,
    className = "",
    style
}) {

    return (

        <div
            className={`
                card
                p-6
                border-l-4
                border-l-primary
                ${className}
            `}
            style={style}
        >

            <div
                className="
                    flex
                    items-center
                    justify-between
                "
            >

                <div>

                    <h2
                        className="
                            text-lg
                            font-semibold
                        "
                    >
                        {title}
                    </h2>

                    {description && (

                        <p
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            {description}
                        </p>

                    )}

                </div>

                {actions}

            </div>

            <CardGridLayout>
                {children}
            </CardGridLayout>

        </div>

    );

}