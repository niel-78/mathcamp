function formatDate(value) {
    if (!value) {
        return null;
    }

    return new Date(value).toLocaleString("sv-SE");
}

export default function ArchiveDates({ item }) {
    const dates = [
        ["Skapad", item.created_at],
        ["Senast ändrad", item.updated_at],
        ["Raderad", item.deleted_at],
        ["Arkiverad", item.archived_at]
    ].filter(([, value]) => value);

    if (!dates.length) {
        return null;
    }

    return (
        <div className="text-sm text-muted-foreground space-y-0.5">
            {dates.map(([label, value]) => (
                <div key={label}>
                    {label}: {formatDate(value)}
                </div>
            ))}
        </div>
    );
}
