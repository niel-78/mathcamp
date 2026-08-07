export function TabSection({
    title,
    children
}) {
    return (

        <div
            className="
                card
                flex-1
                min-w-[320px]
                bg-primary/5
                border-primary/20
            "
        >

            <h2
                className="
                    text-sm
                    font-semibold
                    mb-3
                "
            >
                {title}
            </h2>

            {children}

        </div>

    );
}