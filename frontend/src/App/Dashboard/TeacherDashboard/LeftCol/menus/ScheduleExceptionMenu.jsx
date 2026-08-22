export default function ScheduleExceptionMenu({
    onDelete
}) {
    return (
        <button
            className="
                w-full
                px-3
                py-2
                text-left
                hover:bg-accent
            "
            onClick={onDelete}
        >
            Ta bort
        </button>
    );
}