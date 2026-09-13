import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ImportExistingStudentDialog({
    open,
    onOpenChange,
    group,
    onImported,
}) {
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    const [sourceGroupId, setSourceGroupId] = useState("");
    const [studentId, setStudentId] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !group?.schoolId) {
            return;
        }

        const loadGroups = async () => {
            const response = await fetch(
                `${API_URL}/api/schools/${group.schoolId}/groups`,
                { headers: authHeaders() }
            );

            if (!response.ok) {
                toast.error("Kunde inte hämta skolans grupper.");
                return;
            }

            setGroups(await response.json());
        };

        loadGroups();
    }, [open, group?.schoolId]);

    useEffect(() => {
        if (!sourceGroupId) {
            setStudents([]);
            setStudentId("");
            return;
        }

        const loadStudents = async () => {
            const response = await fetch(
                `${API_URL}/api/groups/${sourceGroupId}/students`,
                { headers: authHeaders() }
            );

            if (!response.ok) {
                toast.error("Kunde inte hämta gruppens elever.");
                return;
            }

            const data = await response.json();
            setStudents(data.students || []);
            setStudentId("");
        };

        loadStudents();
    }, [sourceGroupId]);

    useEffect(() => {
        if (!open) {
            setGroups([]);
            setStudents([]);
            setSourceGroupId("");
            setStudentId("");
            setLoading(false);
        }
    }, [open]);

    const importStudent = async () => {
        const student = students.find(
            item => String(item.id) === studentId
        );

        if (!student) {
            return;
        }

        setLoading(true);

        const response = await fetch(
            `${API_URL}/api/groups/${group.groupId}/students`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                },
                body: JSON.stringify({
                    username: student.username,
                }),
            }
        );

        const data = await response.json();
        setLoading(false);

        if (!response.ok) {
            toast.error(data.error || "Kunde inte importera eleven.");
            return;
        }

        toast.success("Eleven importerades till gruppen.");
        onOpenChange(false);
        onImported?.();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Importera befintlig elev till {group?.groupName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Select
                        value={sourceGroupId}
                        onValueChange={setSourceGroupId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Välj grupp" />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map(sourceGroup => (
                                <SelectItem
                                    key={sourceGroup.id}
                                    value={String(sourceGroup.id)}
                                >
                                    {sourceGroup.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={studentId}
                        onValueChange={setStudentId}
                        disabled={!sourceGroupId || students.length === 0}
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
                                    {student.first_name} {student.last_name}
                                    {student.username ? ` (${student.username})` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        className="w-full"
                        onClick={importStudent}
                        disabled={!studentId || loading}
                    >
                        {loading ? "Importerar..." : "Importera elev"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}