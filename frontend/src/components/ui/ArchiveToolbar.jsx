export default function ArchiveToolbar({
    query,
    setQuery,
    sortBy,
    setSortBy,
    course,
    setCourse,
    book,
    setBook,
    courses = [],
    books = [],
    showCourseBookFilters = true,
    category,
    setCategory,
    categories = [],
    categoryLabel = "Filter",
    stacked = false
}) {
    return (
        <div className={stacked
            ? "flex max-w-xl flex-col items-stretch gap-2 mb-4"
            : "flex flex-wrap items-end gap-2 mb-4"}
        >
            <label className="flex min-w-52 flex-1 flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Frisök</span>
                <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Sök..."
                    className="h-9 rounded-md border bg-background px-3"
                />
            </label>

            <label className="flex min-w-44 flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Sortera efter</span>
                <select
                    value={sortBy}
                    onChange={event => setSortBy(event.target.value)}
                    className="h-9 rounded-md border bg-background px-3"
                >
                    <option value="updated_at">Senast ändrad</option>
                    <option value="created_at">Skapad</option>
                    <option value="deleted_at">Raderad</option>
                    <option value="archived_at">Arkiverad</option>
                </select>
            </label>

            {showCourseBookFilters && (
                <>
                    <label className="flex min-w-40 flex-col gap-1 text-sm">
                        <span className="text-muted-foreground">Kurs</span>
                        <select
                            value={course}
                            onChange={event => setCourse(event.target.value)}
                            className="h-9 rounded-md border bg-background px-3"
                        >
                            <option value="">Alla kurser</option>
                            {courses.map(value => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </label>

                    <label className="flex min-w-40 flex-col gap-1 text-sm">
                        <span className="text-muted-foreground">Bok</span>
                        <select
                            value={book}
                            onChange={event => setBook(event.target.value)}
                            className="h-9 rounded-md border bg-background px-3"
                        >
                            <option value="">Alla böcker</option>
                            {books.map(value => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                </>
            )}

            {setCategory && (
                <label className="flex min-w-40 flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">{categoryLabel}</span>
                    <select
                        value={category}
                        onChange={event => setCategory(event.target.value)}
                        className="h-9 rounded-md border bg-background px-3"
                    >
                        <option value="">Alla</option>
                        {categories.map(value => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                </label>
            )}
        </div>
    );
}
