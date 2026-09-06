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

export default function CreateStaffDialog({
    school,
    open,
    onOpenChange,
    onCreated
}) {

    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const createStaff = async () => {

        if (!school?.schoolId) return;

        const response = await fetch(
            `${API_URL}/api/schools/${school.schoolId}/staff`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({
                    username,
                    first_name: firstName,
                    last_name: lastName,
                    email
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            toast.error(data.error || "Kunde inte skapa personal");
            return;
        }

        toast.success(
            `Personal skapad. Lösenord: ${data.password}`
        );

        window.dispatchEvent(
            new CustomEvent(
                "staff-created",
                {
                    detail: {
                        schoolId: school.schoolId
                    }
                }
            )
        );

        setUsername("");
        setFirstName("");
        setLastName("");
        setEmail("");

        onOpenChange(false);
        onCreated?.();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Lägg till personal i {school?.schoolName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <input
                        className="w-full border rounded p-2"
                        placeholder="Förnamn"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <input
                        className="w-full border rounded p-2"
                        placeholder="Efternamn"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                    <input
                        type="email"
                        className="w-full border rounded p-2"
                        placeholder="E-post"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        className="w-full border rounded p-2"
                        placeholder="Användarnamn"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                createStaff();
                            }
                        }}
                    />
                    <Button
                        onClick={createStaff}
                        className="w-full bg-blue-600 text-white rounded p-2 hover:bg-blue-700 transition-colors"
                    >
                        Skapa personal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}