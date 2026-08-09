import { useState } from "react";

import { Button } from "@/components/ui/button";
import CardSection from "@/components/layouts/CardSection";

import FormatTime from "@/utils/FormatTime";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function StudentMonitorCard({
    student,
    selected,
    onSelect,
    onTerminate,
    onResume
}) {

    const [open, setOpen] = useState(false);

    const handleTerminate = async () => {

        await onTerminate();

        setOpen(false);

    };

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

                {student.status === "in_progress" ? (

                    <AlertDialog
                        open={open}
                        onOpenChange={setOpen}
                    >

                        <AlertDialogTrigger
                            render={
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                />
                            }
                        >
                            Avsluta prov
                        </AlertDialogTrigger>

                        <AlertDialogContent>

                            <AlertDialogHeader>

                                <AlertDialogTitle>
                                    Avsluta prov?
                                </AlertDialogTitle>

                                <AlertDialogDescription>

                                    Detta kommer att avsluta provet för
                                    {" "}
                                    <strong>
                                        {student.first_name}
                                        {" "}
                                        {student.last_name}
                                    </strong>.
                                    {" "}
                                    Åtgärden kan inte ångras.

                                </AlertDialogDescription>

                            </AlertDialogHeader>

                            <AlertDialogFooter>

                                <AlertDialogCancel>
                                    Avbryt
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    variant="destructive"
                                    onClick={handleTerminate}
                                >
                                    Avsluta prov
                                </AlertDialogAction>

                            </AlertDialogFooter>

                        </AlertDialogContent>

                    </AlertDialog>

                ) : (

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={onResume}
                    >
                        Återuppta prov
                    </Button>

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