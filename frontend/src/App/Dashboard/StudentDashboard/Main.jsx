export default function Main({
    children
}) {
    return (

        <main
            className="
                flex-1
                flex
                items-center
                justify-center
                p-6
                bg-background
                text-foreground
            "
        >
            {children}
        </main>

    );
}