export default function Main({
    children
}) {
    return (

        <main
            className="
                flex-1
                min-h-0
                min-w-0
                student-main
                overflow-y-auto
                flex
                items-center
                justify-center
                p-3
                sm:p-6
                bg-background
                text-foreground
            "
        >
            {children}
        </main>

    );
}