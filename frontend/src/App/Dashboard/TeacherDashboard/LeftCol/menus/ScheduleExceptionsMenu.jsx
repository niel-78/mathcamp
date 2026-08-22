export default function ScheduleExceptionsMenu({
    onCreate
}) {

    return (
        <button
            className="w-full text-left px-3 py-2 hover:bg-accent"
            onClick={onCreate}
        >
            Lägg till schemabrytande dag
        </button>
    );

}