import { useState } from "react";
import { API_URL } from "@/config";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AddStudentDialog({
    open,
    onOpenChange,
    groupId,
    onCreated
}) {

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [createdStudent, setCreatedStudent] = useState(null);

    const createStudent = async () => {

        const response = await fetch(
            `${API_URL}/api/teacher/groups/${groupId}/students`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        localStorage.getItem("token")
                },
                body: JSON.stringify({
                    email: username,
                    first_name: firstName,
                    last_name: lastName
                })
            }
        );

        const data = await response.json();

        setCreatedStudent({
            username: data.username,
            password: data.password
        });

        onCreated();
    };

    return (

    <Dialog
        open={open}
        onOpenChange={onOpenChange}
    >
        <DialogContent>

            {!createdStudent ? (

                <>

                    <DialogHeader>
                        <DialogTitle>
                            Lägg till elev
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">

                        <Input
                            placeholder="Förnamn"
                            value={firstName}
                            onChange={(e) =>
                                setFirstName(e.target.value)
                            }
                        />

                        <Input
                            placeholder="Efternamn"
                            value={lastName}
                            onChange={(e) =>
                                setLastName(e.target.value)
                            }
                        />

                        <Input
                            placeholder="Användarnamn"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                        />

                        <Button
                            onClick={createStudent}
                        >
                            Skapa elev
                        </Button>

                    </div>

                </>

            ) : (

                <>

                    <DialogHeader>
                        <DialogTitle>
                            Elev skapad
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2">

                        <p>
                            <strong>
                                Användarnamn:
                            </strong>
                            {" "}
                            {createdStudent.username}
                        </p>

                        <p>
                            <strong>
                                Lösenord:
                            </strong>
                            {" "}
                            {createdStudent.password}
                        </p>

                    </div>

                    <Button
                        onClick={() => {

                            setCreatedStudent(null);

                            setUsername("");
                            setFirstName("");
                            setLastName("");

                            setShowAddStudent(false);

                        }}
                    >
                        Stäng
                    </Button>

                </>

            )}

        </DialogContent>
    </Dialog>)
}
