import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function ImportStudentsDialog({
    open,
    onOpenChange,
    group
}) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {

        if (!open) {

            setFile(null);
            setResult(null);
            setLoading(false);

        }

    }, [open]);

    const importStudents = async () => {

        if (!file) {
            return;
        }

        setLoading(true);

        const formData = new FormData();

        formData.append(
            "file",
            file
        );

        const response = await fetch(
            `${API_URL}/api/groups/${group.groupId}/import-students`,
            {
                method: "POST",
                headers: authHeaders(),
                body: formData
            }
        );

        const data =
            await response.json();

        setResult(data);

        setLoading(false);

    };

    const copyCredentials = async () => {

        const text =
            result.students
                .map(student =>
                    `${student.firstName} ${student.lastName} ${student.username} ${student.password}`
                )
                .join("\n\n");

        await navigator.clipboard.writeText(
            text
        );

    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent
                className="max-w-3xl"
            >
                <DialogHeader>

                    <DialogTitle>
                        Importera elever till{" "}
                        {group?.groupName}
                    </DialogTitle>

                </DialogHeader>

                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) =>
                        setFile(
                            e.target.files?.[0]
                        )
                    }
                />

                <Button
                    onClick={importStudents}
                    disabled={
                        !file || loading
                    }
                >
                    {
                        loading
                            ? "Importerar..."
                            : "Importera"
                    }
                </Button>

                {result && (

                    <div className="space-y-4">

                        <div>
                            {result.importedCount}
                            {" "}
                            elever importerades
                        </div>

                        <Button
                            variant="outline"
                            onClick={
                                copyCredentials
                            }
                        >
                            Kopiera
                            inloggningsuppgifter
                        </Button>

                        <div className="max-h-96 overflow-auto">

                            {result.students.map(
                                student => (

                                    <div
                                        key={student.id}
                                        className="
                                            border
                                            rounded
                                            p-3
                                            mb-2
                                        "
                                    >
                                        <div>
                                            <strong>
                                                {
                                                    student.firstName
                                                }
                                                {" "}
                                                {
                                                    student.lastName
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            Användarnamn:
                                            {" "}
                                            {
                                                student.username
                                            }
                                        </div>

                                        <div>
                                            Lösenord:
                                            {" "}
                                            {
                                                student.password
                                            }
                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    </div>

                )}

            </DialogContent>
        </Dialog>
    );
}