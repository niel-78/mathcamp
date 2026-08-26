import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { toast } from "sonner";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    const [displayName, setDisplayName] = useState("");
    
    useEffect(() => {

        setFirstName(student.first_name);
        setLastName(student.last_name);
        setDisplayName(student.display_name ?? "");

    }, [student]);

    const save = async () => {

        const response = await fetch(
            `${API_URL}/api/students/${student.userId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    display_name: displayName
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

                    <Input
                        placeholder="Visningsnamn"
                        value={displayName}
                        onChange={(e) =>
                            setDisplayName(
                                e.target.value
                            )
                        }
                    />

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

                    <Button
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
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}