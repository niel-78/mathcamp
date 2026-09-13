export function TabSection({
    title,
    active = false,
    badge,
    className = "",
    children
}) {
    return (

        <div
            className={`
                card
                flex-1
                min-w-[320px]
                transition-all
                duration-200
                ${active
                    ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-md"
                    : "bg-primary/5 border-primary/20 opacity-80 hover:opacity-100"}
                ${className}
            `}
        >

            <div className="flex items-center justify-between mb-3">
                <h2
                    className="
                        text-sm
                        font-semibold
                    "
                >
                    {title}
                </h2>

                {badge}
            </div>

            {children}

        </div>

    );
}