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

export default function CreateStudentDialog({
    group,
    open,
    onOpenChange,
    onCreated
}) {

    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const createStudent = async () => {

        const response = await fetch(
            `${API_URL}/api/groups/${group.groupId}/students`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    username,
                    first_name: firstName,
                    last_name: lastName
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            toast.error(data.error);
            return;
        }

        toast.success(
            `Elev skapad. Lösenord: ${data.password}`
        );

        window.dispatchEvent(
            new CustomEvent(
                "student-created",
                {
                    detail: {
                        groupId: group.groupId
                    }
                }
            )
        );

        setUsername("");
        setFirstName("");
        setLastName("");

        onOpenChange(false);

        onCreated?.();
    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Lägg till elev
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-3">

                    <input
                        className="
                            w-full
                            border
                            rounded
                            p-2
                        "
                        placeholder="Förnamn"
                        value={firstName}
                        onChange={(e) =>
                            setFirstName(
                                e.target.value
                            )
                        }
                    />

                    <input
                        className="
                            w-full
                            border
                            rounded
                            p-2
                        "
                        placeholder="Efternamn"
                        value={lastName}
                        onChange={(e) =>
                            setLastName(
                                e.target.value
                            )
                        }
                    />

                    <input
                        className="
                            w-full
                            border
                            rounded
                            p-2
                        "
                        placeholder="Användarnamn"
                        value={username}
                        onChange={(e) =>
                            setUsername(
                                e.target.value
                            )
                        }
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {
                                createStudent();
                            }

                        }}
                    />

                    <Button
                        onClick={createStudent}
                        className="
                            w-full
                            bg-blue-600
                            text-white
                            rounded
                            p-2
                            hover:bg-blue-700
                            transition-colors
                        "
                    >
                        Skapa elev
                    </Button>

                </div>

            </DialogContent>

        </Dialog>

    );

}