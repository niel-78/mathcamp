import { Button } from "@/components/ui/button";
import MetaItem from "@/components/ui/MetaItem";

import {
    BookOpen,
    Layers,
    GraduationCap
} from "lucide-react";

export default function ExamCard({
    assessment,
    openTab,
    onArchive
}) {

    return (

        <div
            className="
                card
                h-full
                flex
                flex-col
            "
        >

            <div className="flex-1">

                <h3
                    className="
                        font-semibold
                        text-lg
                    "
                >
                    {assessment.title}
                </h3>

                <p
                    className="
                        text-xs
                        text-muted-foreground
                    "
                >
                    ID: {assessment.id}
                </p>

            </div>

            <div
                className="
                    grid
                    grid-cols-2
                    gap-3
                    text-sm
                "
            >

                <MetaItem
                    icon={GraduationCap}
                    label="Ämne"
                    value={assessment.subject_name}
                />

                <MetaItem
                    icon={Layers}
                    label="Nivå"
                    value={assessment.level_name}
                />

                <MetaItem
                    icon={BookOpen}
                    label="Bok"
                    value={
                        assessment.book_title ||
                        "Ingen bok"
                    }
                />

                <div>

                    <div
                        className="
                            font-medium
                        "
                    >
                        Block
                    </div>

                    <div
                        className="
                            text-muted-foreground
                        "
                    >
                        {assessment.block_count}
                    </div>

                </div>

            </div>

            <div
                className="
                    mt-4
                    border-t
                    border-border
                    pt-3
                    text-xs
                    text-muted-foreground
                    space-y-1
                "
            >

                <div>

                    Skapad:{" "}

                    {
                        new Date(
                            assessment.created_at
                        ).toLocaleDateString(
                            "sv-SE"
                        )
                    }

                </div>

                <div>

                    Uppdaterad:{" "}

                    {
                        new Date(
                            assessment.updated_at
                        ).toLocaleDateString(
                            "sv-SE"
                        )
                    }

                </div>

            </div>

            <div
                className="
                    mt-4
                    flex
                    justify-end
                    gap-2
                "
            >

                {assessment.role === "owner" && (

                    <Button
                        variant="outline"
                        onClick={() =>
                            onArchive?.(assessment)
                        }
                    >
                        Arkivera
                    </Button>

                )}

                <Button
                    onClick={() =>
                        openTab({
                            id: `assessment-${assessment.id}`,
                            title: assessment.title,
                            type: "assessment",
                            assessmentId: assessment.id
                        })
                    }
                >
                    Öppna
                </Button>

            </div>

        </div>

    );

}