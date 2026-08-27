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
                        id: "teacher-calendar",
                        title: "Min kalender",
                        type: "teacher-calendar"
                    })
                }
            >
                Min kalender
            </Button>

            <Button
                onClick={() =>
                    openTab({
                        id: "assessments",
                        title: "Provbank",
                        type: "assessments"
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
                        id: "group-assessments",
                        title: "Provtillfällen",
                        type: "group-assessments"
                    })
                }
            >
                Provtillfällen
            </Button>
            <Button
                onClick={() =>
                    openTab({
                        id: "presentations",
                        title: "Presentationer",
                        type: "presentations"
                    })
                }
            >
                Presentationer
            </Button>

        </BaseTabLayout>
    );
}