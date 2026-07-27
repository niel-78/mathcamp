import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function RenameStudentDialog({
    student,
    open,
    onOpenChange,
    onRenamed
}) {

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    
    useEffect(() => {

        setFirstName(
            student?.firstName ?? ""
        );

        setLastName(
            student?.lastName ?? ""
        );

    }, [student]);

    const save = async () => {

        const response = await fetch(
            `${API_URL}/api/teacher/students/${student.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        localStorage.getItem("token")
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName
                })
            }
        );

        if (!response.ok) {
            toast.error("Kunde inte spara");
            return;
        }

        toast.success("Elev uppdaterad");

        onOpenChange(false);

        onRenamed?.();
    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>
                    <DialogTitle>
                        Byt namn
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">

                    <input
                        className="w-full border rounded p-2"
                        value={firstName}
                        onChange={(e) =>
                            setFirstName(e.target.value)
                        }
                    />

                    <input
                        className="w-full border rounded p-2"
                        value={lastName}
                        onChange={(e) =>
                            setLastName(e.target.value)
                        }
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {
                                save();
                            }

                        }}
                    />

                    <button
                        onClick={save}
                        className="
                            w-full
                            bg-blue-600
                            text-white
                            p-2
                            rounded
                            hover:bg-blue-700
                        "
                    >
                        Spara
                    </button>

                </div>

            </DialogContent>

        </Dialog>

    );

}