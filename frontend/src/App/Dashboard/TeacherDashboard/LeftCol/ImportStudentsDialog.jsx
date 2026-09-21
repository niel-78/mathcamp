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
    const [importMode, setImportMode] = useState("file");
    const [csvText, setCsvText] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {

        if (!open) {

            setFile(null);
            setImportMode("file");
            setCsvText("");
            setResult(null);
            setLoading(false);

        }

    }, [open]);

    const downloadTemplate = async () => {
        const response = await fetch(
            `${API_URL}/api/groups/student-import-template`,
            {
                headers: authHeaders()
            }
        );

        if (!response.ok) {
            return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "elever-mall.xlsx";
        link.click();

        URL.revokeObjectURL(url);
    };

    const importStudents = async () => {

        if (importMode === "file" && !file) {
            return;
        }

        if (importMode === "csv" && !csvText.trim()) {
            return;
        }

        setLoading(true);

        const formData = new FormData();

        if (importMode === "csv") {
            formData.append("csvText", csvText);
        } else {
            formData.append("file", file);
        }

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

                <Button
                    variant="outline"
                    onClick={downloadTemplate}
                >
                    Ladda ner elevmall
                </Button>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={importMode === "file" ? "default" : "outline"}
                        onClick={() => setImportMode("file")}
                    >
                        Excel/CSV-fil
                    </Button>
                    <Button
                        type="button"
                        variant={importMode === "csv" ? "default" : "outline"}
                        onClick={() => setImportMode("csv")}
                    >
                        Klistra in CSV-text
                    </Button>
                </div>

                {importMode === "file" ? (
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => setFile(e.target.files?.[0])}
                    />
                ) : (
                    <textarea
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder="Klistra in CSV-data (samma kolumner som elevmallen)"
                        rows={10}
                        className="w-full rounded border p-2 font-mono text-sm"
                    />
                )}

                <Button
                    onClick={importStudents}
                    disabled={
                        loading ||
                        (importMode === "file" ? !file : !csvText.trim())
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