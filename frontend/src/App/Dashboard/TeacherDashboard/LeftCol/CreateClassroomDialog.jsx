import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateClassroomDialog({
    open,
    onOpenChange,
    onCreated,
    schoolId
}) {

    const [name, setName] =
        useState("");

    const [layouts, setLayouts] =
        useState([]);

    const [sourceLayoutId, setSourceLayoutId] = useState("");

    useEffect(() => {
        loadLayouts();
    }, []);

    const loadLayouts = async () => {

        const response =
            await fetch(
                `${API_URL}/api/classroom-layouts`,
                {
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        setLayouts(data);
    };

    const save = async () => {

        const response =
            await fetch(
                `${API_URL}/api/classrooms`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({
                        schoolId,
                        name,
                        sourceLayoutId
                    })
                }
            );

        if (!response.ok) {
            return;
        }

        setName("");

        onCreated?.();

        onOpenChange(false);

    };

    console.log(layouts);

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Nytt klassrum
                    </DialogTitle>

                </DialogHeader>

                <Input
                    placeholder="Namn"
                    value={name}
                    onChange={(e) =>
                        setName(e.target.value)
                    }
                />

                <Select
                    value={sourceLayoutId}
                    onValueChange={setSourceLayoutId}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Ingen" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="none">
                            Ingen
                        </SelectItem>

                        {layouts.map(layout => (
                            <SelectItem
                                key={layout.id}
                                value={String(layout.id)}
                            >
                                {layout.classroom_name} - {layout.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button onClick={save}>
                    Skapa
                </Button>

            </DialogContent>

        </Dialog>

    );

}