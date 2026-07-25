import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EditStudentDialog({
    open,
    onOpenChange,
    student,
    onSaved
}) {


    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");

    useEffect(() => {

        if (!student) {
            return;
        }

        setFirstName(student.first_name);
        setLastName(student.last_name);
        setUsername(student.username);

    }, [student]);

    const saveStudent = async () => {

        await fetch(
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
                    last_name: lastName,
                    email: username
                })
            }
        );

        onSaved?.();

        onOpenChange(false);

    };

    return(
        <Dialog
        open={open}
        onOpenChange={onOpenChange}
    >

        <DialogContent>

            <DialogHeader>

                <DialogTitle>
                    Redigera elev
                </DialogTitle>

            </DialogHeader>

            <div className="space-y-4">

                <Input
                    value={firstName}
                    onChange={(e) =>
                        setFirstName(
                            e.target.value
                        )
                    }
                />

                <Input
                    value={lastName}
                    onChange={(e) =>
                        setLastName(
                            e.target.value
                        )
                    }
                />

                <Input
                    value={username}
                    onChange={(e) =>
                        setUsername(
                            e.target.value
                        )
                    }
                />

                <Button
                    onClick={saveStudent}
                >
                    Spara
                </Button>

            </div>

        </DialogContent>

    </Dialog>
    )

}