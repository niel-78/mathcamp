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
                        id: "my-lessons",
                        title: "Mina lektioner",
                        type: "my-lessons"
                    })
                }
            >
                Mina lektioner
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