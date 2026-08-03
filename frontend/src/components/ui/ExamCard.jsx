import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Layers,
    GraduationCap
} from "lucide-react";

export default function ExamCard({
    exam,
    openTab
}) {

    return (

        <div
            className="
                rounded-lg
                border
                bg-white
                p-4
                shadow-sm
            "
        >

            <div className="mb-4">

                <h3 className="font-semibold text-lg">
                    {exam.title}
                </h3>

                <p className="text-xs text-muted-foreground">
                    ID: {exam.id}
                </p>

            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">

                <div className="flex items-center gap-2">

                    <GraduationCap
                        size={16}
                    />

                    <div>

                        <div className="font-medium">
                            Ämne
                        </div>

                        <div className="text-muted-foreground">
                            {exam.subject_name}
                        </div>

                    </div>

                </div>

                <div className="flex items-center gap-2">

                    <Layers
                        size={16}
                    />

                    <div>

                        <div className="font-medium">
                            Nivå
                        </div>

                        <div className="text-muted-foreground">
                            {exam.level_name}
                        </div>

                    </div>

                </div>

                <div className="flex items-center gap-2">

                    <BookOpen
                        size={16}
                    />

                    <div>

                        <div className="font-medium">
                            Bok
                        </div>

                        <div className="text-muted-foreground">
                            {exam.book_title ||
                                "Ingen bok"}
                        </div>

                    </div>

                </div>

                <div>

                    <div className="font-medium">
                        Block
                    </div>

                    <div className="text-muted-foreground">
                        {exam.block_count}
                    </div>

                </div>

            </div>

            <div
                className="
                    mt-4
                    border-t
                    pt-3
                    text-xs
                    text-muted-foreground
                    space-y-1
                "
            >

                <div>
                    Skapad:{" "}
                    {new Date(
                        exam.created_at
                    ).toLocaleDateString("sv-SE")}
                </div>

                <div>
                    Uppdaterad:{" "}
                    {new Date(
                        exam.updated_at
                    ).toLocaleDateString("sv-SE")}
                </div>

            </div>

            <div className="mt-4 flex justify-end">

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