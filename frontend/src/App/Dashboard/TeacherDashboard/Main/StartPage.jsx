import { Button } from "@/components/ui/button";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";   

export default function StartPage({
    openTab
}) {

    return (
        <BaseTabLayout
            title="Startsida"
        >

            <Button
                onClick={() =>
                    openTab({
                        id: "exams",
                        title: "Provbank",
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

        </BaseTabLayout>
    );
}