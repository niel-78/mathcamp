import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AddStudentDialog({
    open,
    onOpenChange,
    groupId,
    onCreated
}) {

    const [students, setStudents] = useState([]);
    const [studentIds, setStudentIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        const loadStudents = async () => {
            const response = await fetch(
                `${API_URL}/api/students`,
                { headers: authHeaders() }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            setStudents(
                data.sort((firstStudent, secondStudent) =>
                    `${firstStudent.last_name} ${firstStudent.first_name}`
                        .localeCompare(
                            `${secondStudent.last_name} ${secondStudent.first_name}`,
                            "sv"
                        )
                )
            );
        };

        loadStudents();
    }, [open]);

    const addStudents = async () => {
        if (!studentIds.length) {
            return;
        }

        setLoading(true);

        const response = await fetch(
            `${API_URL}/api/groups/${groupId}/students/bulk`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                },
                body: JSON.stringify({ student_ids: studentIds })
            }
        );

        setLoading(false);

        if (response.ok) {
            setStudentIds([]);
            onCreated();
            onOpenChange(false);
        }
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

            <div className="space-y-4">
                <Select
                    multiple
                    value={studentIds}
                    onValueChange={setStudentIds}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Välj elev" />
                    </SelectTrigger>
                    <SelectContent>
                        {students.map(student => (
                            <SelectItem
                                key={student.id}
                                value={String(student.id)}
                            >
                                {student.last_name}, {student.first_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    onClick={addStudents}
                    disabled={!studentIds.length || loading}
                >
                    {loading ? "Importerar..." : "Importera elever"}
                </Button>
            </div>

        </DialogContent>
    </Dialog>)
}
