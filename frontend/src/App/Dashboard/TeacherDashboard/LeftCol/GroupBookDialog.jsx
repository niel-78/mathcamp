import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
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

export default function GroupBookDialog({
    group,
    books,
    open,
    onOpenChange,
    onSaved
}) {

    const [bookId, setBookId] = useState("");
    const [saving, setSaving] = useState(false);

    const selectedBook = books.find(
        book => String(book.id) === String(bookId)
    );

    useEffect(() => {
        setBookId(group?.bookId ? String(group.bookId) : "");
    }, [group]);

    const save = async () => {

        try {
            setSaving(true);

            const response = await fetch(
                `${API_URL}/api/groups/${group.id}/book`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({
                        book_id: Number(bookId)
                    })
                }
            );

            if (response.ok) {
                onOpenChange(false);
                onSaved?.();
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Byt bok för grupp</DialogTitle>
                </DialogHeader>

                <Select value={bookId} onValueChange={setBookId}>
                    <SelectTrigger className="w-full min-w-[300px]">
                        <SelectValue placeholder="Välj bok">
                            {selectedBook?.title}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {books.map(book => (
                            <SelectItem key={book.id} value={String(book.id)}>
                                {book.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button disabled={!bookId || saving} onClick={save}>
                    Spara
                </Button>
            </DialogContent>
        </Dialog>
    );
}