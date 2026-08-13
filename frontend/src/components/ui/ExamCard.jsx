import { Button } from "@/components/ui/button";
import MetaItem from "@/components/ui/MetaItem";

import {
    BookOpen,
    Layers,
    GraduationCap
} from "lucide-react";

export default function ExamCard({
    exam,
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
                    {exam.title}
                </h3>

                <p
                    className="
                        text-xs
                        text-muted-foreground
                    "
                >
                    ID: {exam.id}
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
                    value={exam.subject_name}
                />

                <MetaItem
                    icon={Layers}
                    label="Nivå"
                    value={exam.level_name}
                />

                <MetaItem
                    icon={BookOpen}
                    label="Bok"
                    value={
                        exam.book_title ||
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
                        {exam.block_count}
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
                            exam.created_at
                        ).toLocaleDateString(
                            "sv-SE"
                        )
                    }

                </div>

                <div>

                    Uppdaterad:{" "}

                    {
                        new Date(
                            exam.updated_at
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

                {exam.role === "owner" && (

                    <Button
                        variant="outline"
                        onClick={() =>
                            onArchive?.(exam)
                        }
                    >
                        Arkivera
                    </Button>

                )}

                <Button
                    onClick={() =>
                        openTab({
                            id: `exam-${exam.id}`,
                            title: exam.title,
                            type: "exam",
                            examId: exam.id
                        })
                    }
                >
                    Öppna
                </Button>

            </div>

        </div>

    );

}