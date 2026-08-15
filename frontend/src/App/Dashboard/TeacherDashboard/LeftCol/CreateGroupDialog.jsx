import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export default function CreateGroupDialog({
    open,
    onOpenChange,
    onCreated,
}) {

    const [name, setName] = useState("");

    const [subjects, setSubjects] = useState([]);
    const [books, setBooks] = useState([]);

    const [subjectId, setSubjectId] = useState(null);
    const [levelId, setLevelId] = useState(null);
    const [bookId, setBookId] = useState(null);

    useEffect(() => {
        loadSubjects();
        loadBooks();
    }, []);

    const loadSubjects = async () => {

        const response = await fetch(
            `${API_URL}/api/subjects`,
            {
                headers: authHeaders(),
            }
        );

        const data = await response.json();

        setSubjects(data);
    };

    const loadBooks = async () => {

        const response = await fetch(
            `${API_URL}/api/books`
        );

        const data = await response.json();

        setBooks(data);
    };

    const selectedSubject =
        subjects.find(
            subject => subject.id === subjectId
        );

    const levels =
        selectedSubject?.levels || [];

    const createGroup = async () => {

        const response = await fetch(
            `${API_URL}/api/groups`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                },
                body: JSON.stringify({
                    name,
                    level_id: levelId,
                    book_id: bookId,
                }),
            }
        );

        if (response.ok) {

            setName("");
            setSubjectId(null);
            setLevelId(null);
            setBookId(null);

            onOpenChange(false);

            onCreated?.();
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
                        Ny grupp
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">

                    <div className="space-y-2">
                        <Label>
                            Gruppnamn
                        </Label>

                        <Input
                            value={name}
                            placeholder="Gruppnamn"
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            onKeyDown={(e) => {

                                if (
                                    e.key === "Enter" &&
                                    name &&
                                    levelId &&
                                    bookId
                                ) {
                                    createGroup();
                                }

                            }}
                        />
                    </div>

                    <div className="space-y-2">

                        <Label>
                            Ämne
                        </Label>

                        <Select
                            value={
                                subjectId
                                    ? String(subjectId)
                                    : undefined
                            }
                            onValueChange={(value) => {

                                setSubjectId(
                                    Number(value)
                                );

                                setLevelId(null);

                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Välj ämne" />
                            </SelectTrigger>

                            <SelectContent>

                                {subjects.map(subject => (

                                    <SelectItem
                                        key={subject.id}
                                        value={String(subject.id)}
                                    >
                                        {subject.name}
                                    </SelectItem>

                                ))}

                            </SelectContent>

                        </Select>

                    </div>

                    <div className="space-y-2">

                        <Label>
                            Nivå
                        </Label>

                        <Select
                            value={
                                levelId
                                    ? String(levelId)
                                    : undefined
                            }
                            disabled={!subjectId}
                            onValueChange={(value) =>
                                setLevelId(
                                    Number(value)
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Välj nivå" />
                            </SelectTrigger>

                            <SelectContent>

                                {levels.map(level => (

                                    <SelectItem
                                        key={level.id}
                                        value={String(level.id)}
                                    >
                                        {level.code
                                            ? `${level.code} - ${level.name}`
                                            : level.name}
                                    </SelectItem>

                                ))}

                            </SelectContent>

                        </Select>

                    </div>

                    <div className="space-y-2">

                        <Label>
                            Bok
                        </Label>

                        <Select
                            value={
                                bookId
                                    ? String(bookId)
                                    : undefined
                            }
                            onValueChange={(value) =>
                                setBookId(
                                    Number(value)
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Välj bok" />
                            </SelectTrigger>

                            <SelectContent>

                                {books.map(book => (

                                    <SelectItem
                                        key={book.id}
                                        value={String(book.id)}
                                    >
                                        {book.title}
                                    </SelectItem>

                                ))}

                            </SelectContent>

                        </Select>

                    </div>

                    <Button
                        onClick={createGroup}
                        disabled={
                            !name ||
                            !levelId ||
                            !bookId
                        }
                    >
                        Skapa grupp
                    </Button>

                </div>

            </DialogContent>

        </Dialog>
    );
}