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
import { Input } from "@/components/ui/input";

import { toast } from "sonner";

export default function ExportBlockDialog({
    open,
    onOpenChange,
    blockId,
    block,
    onExported
}) {

    const [books, setBooks] = useState([]);
    const [bookId, setBookId] = useState("");
    const [chapterId, setChapterId] = useState("");
    const [subchapterId, setSubchapterId] = useState("");
    const [sectionId, setSectionId] = useState("");

    const [series, setSeries] = useState([]);
    const [abilities, setAbilities] = useState([]);
    const [seriesId, setSeriesId] = useState("");
    const [abilityId, setAbilityId] = useState("");

    const [newAbilityName, setNewAbilityName] = useState("");
    const [creatingAbility, setCreatingAbility] = useState(false);

    const [saving, setSaving] = useState(false);

    useEffect(() => {

        if (!open) {
            return;
        }

        setBookId("");
        setChapterId("");
        setSubchapterId("");
        setSectionId("");
        setSeriesId("");
        setAbilityId("");
        setNewAbilityName("");

        loadBooks();
        loadSeries();
        loadAbilities();

    }, [open]);

    async function loadBooks() {

        const response =
            await fetch(
                `${API_URL}/api/books`,
                { headers: authHeaders() }
            );

        const data = await response.json();

        setBooks(Array.isArray(data) ? data : []);

    }

    async function loadSeries() {

        const response =
            await fetch(
                `${API_URL}/api/ability-series`,
                { headers: authHeaders() }
            );

        const data = await response.json();

        setSeries(Array.isArray(data) ? data : []);

    }

    async function loadAbilities() {

        const response =
            await fetch(
                `${API_URL}/api/abilities`,
                { headers: authHeaders() }
            );

        const data = await response.json();

        setAbilities(Array.isArray(data) ? data : []);

    }

    const selectedBook =
        books.find(
            book => book.id === Number(bookId)
        );

    const selectedChapter =
        selectedBook?.chapters?.find(
            chapter => chapter.id === Number(chapterId)
        );

    const selectedSubchapter =
        selectedChapter?.subchapters?.find(
            subchapter => subchapter.id === Number(subchapterId)
        );

    const sections =
        selectedSubchapter?.sections ?? [];

    const filteredAbilities =
        abilities.filter(
            ability =>
                ability.series_id === Number(seriesId)
        );

    function findMatchingSection(book) {

        const sectionTitles =
            (block?.bookSections || [])
                .map(section => section.title);

        if (sectionTitles.length === 0) {
            return null;
        }

        for (const chapter of book.chapters || []) {

            for (const subchapter of chapter.subchapters || []) {

                const match =
                    subchapter.sections?.find(
                        section =>
                            sectionTitles.includes(section.title)
                    );

                if (match) {

                    return {
                        chapterId: chapter.id,
                        subchapterId: subchapter.id,
                        sectionId: match.id
                    };

                }

            }

        }

        return null;

    }

    function handleBookChange(nextBookId) {

        setBookId(nextBookId);
        setChapterId("");
        setSubchapterId("");
        setSectionId("");

        const book =
            books.find(
                item => item.id === Number(nextBookId)
            );

        const match =
            book && findMatchingSection(book);

        if (match) {

            setChapterId(String(match.chapterId));
            setSubchapterId(String(match.subchapterId));
            setSectionId(String(match.sectionId));

        }

    }

    const firstBlockAbilityName =
        block?.abilities?.[0]?.name;

    const showCreateAbility =
        Boolean(seriesId) &&
        Boolean(firstBlockAbilityName) &&
        !filteredAbilities.some(
            ability => ability.name === firstBlockAbilityName
        );

    function handleSeriesChange(nextSeriesId) {

        setSeriesId(nextSeriesId);
        setAbilityId("");
        setNewAbilityName("");

        const match =
            abilities.find(
                ability =>
                    ability.series_id === Number(nextSeriesId) &&
                    ability.name === firstBlockAbilityName
            );

        if (match) {

            setAbilityId(String(match.id));

        } else if (firstBlockAbilityName) {

            setNewAbilityName(firstBlockAbilityName);

        }

    }

    async function handleCreateAbility() {

        if (!newAbilityName.trim()) {
            return;
        }

        try {

            setCreatingAbility(true);

            const response =
                await fetch(
                    `${API_URL}/api/abilities`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            ...authHeaders()
                        },
                        body: JSON.stringify({
                            name: newAbilityName.trim(),
                            seriesId: Number(seriesId)
                        })
                    }
                );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Kunde inte skapa förmågan."
                );

            }

            setAbilities(
                previous => [
                    ...previous,
                    {
                        id: data.id,
                        name: data.name,
                        series_id: Number(seriesId)
                    }
                ]
            );

            setAbilityId(String(data.id));
            setNewAbilityName("");

        } catch (error) {

            toast.error(
                error.message
            );

        } finally {

            setCreatingAbility(false);

        }

    }

    async function handleExport() {

        if (!sectionId || !abilityId) {

            toast.error(
                "Välj både avsnitt och förmåga."
            );

            return;

        }

        try {

            setSaving(true);

            const response =
                await fetch(
                    `${API_URL}/api/blocks/${blockId}/export`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            ...authHeaders()
                        },
                        body: JSON.stringify({
                            section_id: Number(sectionId),
                            ability_id: Number(abilityId)
                        })
                    }
                );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Kunde inte exportera blocket."
                );

            }

            toast.success(
                "Blocket exporterades."
            );

            onExported?.(data);

            onOpenChange(false);

        } catch (error) {

            toast.error(
                error.message
            );

        } finally {

            setSaving(false);

        }

    }

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent className="max-w-lg">

                <DialogHeader>

                    <DialogTitle>
                        Exportera block
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <div className="space-y-2">

                        <div className="text-sm font-medium">
                            Bok och avsnitt
                        </div>

                        <select
                            className="input-standard"
                            value={bookId}
                            onChange={(e) =>
                                handleBookChange(e.target.value)
                            }
                        >

                            <option value="">
                                Välj bok
                            </option>

                            {books.map(book => (

                                <option
                                    key={book.id}
                                    value={book.id}
                                >
                                    {book.title}
                                </option>

                            ))}

                        </select>

                        <select
                            className="input-standard"
                            value={chapterId}
                            disabled={!bookId}
                            onChange={(e) => {

                                setChapterId(e.target.value);
                                setSubchapterId("");
                                setSectionId("");

                            }}
                        >

                            <option value="">
                                Välj kapitel
                            </option>

                            {selectedBook?.chapters?.map(chapter => (

                                <option
                                    key={chapter.id}
                                    value={chapter.id}
                                >
                                    {chapter.chapter_number}
                                    {" "}
                                    {chapter.title}
                                </option>

                            ))}

                        </select>

                        <select
                            className="input-standard"
                            value={subchapterId}
                            disabled={!chapterId}
                            onChange={(e) => {

                                setSubchapterId(e.target.value);
                                setSectionId("");

                            }}
                        >

                            <option value="">
                                Välj delkapitel
                            </option>

                            {selectedChapter?.subchapters?.map(subchapter => (

                                <option
                                    key={subchapter.id}
                                    value={subchapter.id}
                                >
                                    {subchapter.title}
                                </option>

                            ))}

                        </select>

                        <select
                            className="input-standard"
                            value={sectionId}
                            disabled={!subchapterId}
                            onChange={(e) =>
                                setSectionId(e.target.value)
                            }
                        >

                            <option value="">
                                Välj avsnitt
                            </option>

                            {sections.map(section => (

                                <option
                                    key={section.id}
                                    value={section.id}
                                >
                                    {section.title}
                                    {" "}
                                    (sid {section.page_number})
                                </option>

                            ))}

                        </select>

                    </div>

                    <div className="space-y-2">

                        <div className="text-sm font-medium">
                            Förmågaserie och förmåga
                        </div>

                        <select
                            className="input-standard"
                            value={seriesId}
                            onChange={(e) =>
                                handleSeriesChange(e.target.value)
                            }
                        >

                            <option value="">
                                Välj förmågaserie
                            </option>

                            {series.map(item => (

                                <option
                                    key={item.id}
                                    value={item.id}
                                >
                                    {item.name}
                                </option>

                            ))}

                        </select>

                        <select
                            className="input-standard"
                            value={abilityId}
                            disabled={!seriesId}
                            onChange={(e) =>
                                setAbilityId(e.target.value)
                            }
                        >

                            <option value="">
                                Välj förmåga
                            </option>

                            {filteredAbilities.map(ability => (

                                <option
                                    key={ability.id}
                                    value={ability.id}
                                >
                                    {ability.name}
                                </option>

                            ))}

                        </select>

                        {showCreateAbility && (

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    rounded-md
                                    border
                                    border-dashed
                                    p-2
                                "
                            >

                                <Input
                                    className="input-standard"
                                    value={newAbilityName}
                                    placeholder="Namn på ny förmåga"
                                    onChange={(e) =>
                                        setNewAbilityName(e.target.value)
                                    }
                                />

                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={creatingAbility}
                                    onClick={handleCreateAbility}
                                >
                                    Skapa förmåga
                                </Button>

                            </div>

                        )}

                    </div>

                    <div className="flex justify-end gap-2">

                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Avbryt
                        </Button>

                        <Button
                            disabled={saving}
                            onClick={handleExport}
                        >
                            Exportera
                        </Button>

                    </div>

                </div>

            </DialogContent>

        </Dialog>

    );

}
