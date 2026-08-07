export function TabSectionRow({
    children
}) {
    return (

        <div
            className="
                flex
                flex-wrap
                gap-4
            "
        >
            {children}
        </div>

    );
}