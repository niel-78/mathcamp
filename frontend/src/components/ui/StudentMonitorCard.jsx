import { Button } from "@/components/ui/button";
import CardSection from "@/components/layouts/CardSection";

import FormatTime from "@/utils/FormatTime";

export default function StudentMonitorCard({
    student,
    selected,
    onSelect
}) {

    return (

        <CardSection
            title={`${student.first_name} ${student.last_name}`}
        >

            <div className="space-y-3">

                <div>

                    <strong>Status:</strong>
                    {" "}

                    {student.status === "in_progress" &&
                        "Pågående"}

                    {student.status === "submitted" &&
                        "Inlämnad"}

                    {!student.status &&
                        "Ej startat"}

                </div>

                {student.started_at && (

                    <div>

                        <strong>Start:</strong>
                        {" "}

                        <FormatTime
                            value={student.started_at}
                        />

                    </div>

                )}

                <Button
                    className="w-full"
                    variant={
                        selected
                            ? "secondary"
                            : "default"
                    }
                    onClick={onSelect}
                >
                    {selected
                        ? "Vald"
                        : "Visa detaljer"}
                </Button>

            </div>

        </CardSection>

    );

}