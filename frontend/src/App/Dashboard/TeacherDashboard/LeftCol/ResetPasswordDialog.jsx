import { useState } from "react";
import { API_URL } from "@/config";
import { toast } from "sonner";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function ResetPasswordDialog({
    student,
    open,
    onOpenChange
}) {

    const [newPassword, setNewPassword] =
        useState("");

    const resetPassword = async () => {

        const studentId =
            student?.userId ??
            student?.id;

        if (!studentId) {
            toast.error(
                "Elev saknas. Öppna eleven igen."
            );
            return;
        }

        const response = await fetch(
            `${API_URL}/api/students/${studentId}/password`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    password: newPassword
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            toast.error(
                "Kunde inte byta lösenord"
            );

            return;
        }

        toast.success(
            `Nytt lösenord: ${data.password}`,
            {
                duration: 20000
            }
        );

        setNewPassword("");

        onOpenChange(false);

    };


    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>

                        Nytt lösenord

                        {student &&
                            ` - ${student.name}`}

                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <input
                        className="
                            w-full
                            border
                            rounded
                            p-2
                        "
                        placeholder="
                            Lämna tomt för automatiskt lösenord
                        "
                        value={newPassword}
                        onChange={(e) =>
                            setNewPassword(
                                e.target.value
                            )
                        }
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {
                                resetPassword();
                            }

                        }}
                    />

                    <div className="flex gap-2">

                        <Button
                            className="
                                flex-1
                                bg-blue-600
                                text-white
                                p-2
                                rounded
                                hover:bg-blue-700
                            "
                            onClick={resetPassword}
                        >
                            Spara lösenord
                        </Button>

                    </div>

                </div>

            </DialogContent>

        </Dialog>

    );

}