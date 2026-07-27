export default function StartPage({
    openTab
}) {

    return (
        <div className="p-8 flex gap-4">

            <button
                onClick={() =>
                    openTab({
                        id: "exams",
                        title: "Prov",
                        type: "exams"
                    })
                }
            >
                Prov
            </button>

            <button
                onClick={() =>
                    openTab({
                        id: "blocks",
                        title: "Frågebank",
                        type: "blocks"
                    })
                }
            >
                Frågebank
            </button>

        </div>
    );
}