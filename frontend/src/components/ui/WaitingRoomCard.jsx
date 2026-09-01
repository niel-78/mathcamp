import CardSection from "@/components/layouts/CardSection";
import FormatTime from "@/utils/formatTime";
import { Button } from "@/components/ui/button";

export default function WaitingRoomCard({
    student,
    onAdmit
}) {

    return (

        <CardSection
            title={
                `${student.first_name}
                 ${student.last_name}`
            }
        >

            <div className="space-y-3">

                <div className="text-sm text-muted-foreground">
                    Anslöt:
                    {" "}
                    <FormatTime
                        value={student.joined_at}
                    />
                </div>

                <Button
                    onClick={() =>
                        onAdmit(student.id)
                    }
                >
                    Släpp in elev
                </Button>

            </div>

        </CardSection>

    );

}