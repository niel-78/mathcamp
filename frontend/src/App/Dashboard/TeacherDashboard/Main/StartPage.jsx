import { Button } from "@/components/ui/button";

export default function StartPage({
    openTab
}) {

    return (
        <div className="p-8 flex gap-4">

            <Button
                onClick={() =>
                    openTab({
                        id: "exams",
                        title: "Prov",
                        type: "exams"
                    })
                }
            >
                Provbank
            </Button>

            <Button
                onClick={() =>
                    openTab({
                        id: "blocks",
                        title: "Frågebank",
                        type: "blocks"
                    })
                }
            >
                Frågebank
            </Button>

            <Button
                onClick={() =>
                    openTab({
                        id: "group-exams",
                        title: "Provtillfällen",
                        type: "group-exams"
                    })
                }
            >
                Provtillfällen
            </Button>

        </div>
    );
}