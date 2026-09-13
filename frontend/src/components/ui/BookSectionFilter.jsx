import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import TabPanelSection from "@/components/layouts/TabPanelSection";

export default function BookSectionFilter({
    bookFilter = {},
    onFilterChange,
    sectionId,
    onSectionChange
}) {

    const [books, setBooks] =
        useState([]);

    const [bookId, setBookId] =
        useState(bookFilter.bookId || "");

    const [chapterId, setChapterId] =
        useState(bookFilter.chapterId || "");

    const [subchapterId, setSubchapterId] =
        useState(bookFilter.subchapterId || "");

    const [currentSectionId, setCurrentSectionId] =
        useState(bookFilter.sectionId || sectionId || "");

    useEffect(() => {
        if (bookFilter.bookId !== undefined) setBookId(bookFilter.bookId || "");
        if (bookFilter.chapterId !== undefined) setChapterId(bookFilter.chapterId || "");
        if (bookFilter.subchapterId !== undefined) setSubchapterId(bookFilter.subchapterId || "");
        if (bookFilter.sectionId !== undefined) setCurrentSectionId(bookFilter.sectionId || "");
    }, [bookFilter.bookId, bookFilter.chapterId, bookFilter.subchapterId, bookFilter.sectionId]);

    useEffect(() => {
        if (sectionId !== undefined && sectionId !== currentSectionId) {
            setCurrentSectionId(sectionId || "");
        }
    }, [sectionId]);

    const notifyChange = (newBookId, newChapterId, newSubchapterId, newSectionId) => {
        onFilterChange?.({
            bookId: newBookId,
            chapterId: newChapterId,
            subchapterId: newSubchapterId,
            sectionId: newSectionId
        });
        onSectionChange?.(newSectionId);
    };

    useEffect(() => {

        const loadBooks = async () => {

            const response =
                await fetch(
                    `${API_URL}/api/books`
                );

            const data =
                await response.json();

            setBooks(data);

        };

        loadBooks();

    }, []);

    const selectedBook =
        books.find(
            book =>
                book.id ===
                Number(bookId)
        );

    const selectedChapter =
        selectedBook?.chapters?.find(
            chapter =>
                chapter.id ===
                Number(chapterId)
        );

    const selectedSubchapter =
        selectedChapter?.subchapters?.find(
            subchapter =>
                subchapter.id ===
                Number(subchapterId)
        );

    const chapters =

        bookId

            ? selectedBook?.chapters ?? []

            : books.flatMap(
                book =>
                    book.chapters || []
            );
            
    const subchapters =

        chapterId

            ? selectedChapter?.subchapters ?? []

            : chapters.flatMap(
                chapter =>
                    chapter.subchapters || []
            );

    const sections =

        subchapterId

            ? selectedSubchapter?.sections ?? []

            : subchapters.flatMap(
                subchapter =>
                    subchapter.sections || []
            );
    
    return (

        <TabPanelSection
            title="Filtrera på avsnitt i matematikbok"
            description="
                Hitta block utifrån
                bok, kapitel, delkapitel och avsnitt.
            "
        >

            <select
                className="input-standard"
                value={bookId}
                onChange={(e) => {
                    const newBookId = e.target.value;
                    setBookId(newBookId);
                    setChapterId("");
                    setSubchapterId("");
                    setCurrentSectionId("");
                    notifyChange(newBookId, "", "", "");
                }}
            >

                <option value="">
                    Alla böcker
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
                onChange={(e) => {
                    const newChapterId = e.target.value;
                    setChapterId(newChapterId);
                    setSubchapterId("");
                    setCurrentSectionId("");
                    notifyChange(bookId, newChapterId, "", "");
                }}
            >

                <option value="">
                    Alla kapitel
                </option>

                {chapters.map(chapter => (

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
                onChange={(e) => {
                    const newSubchapterId = e.target.value;
                    setSubchapterId(newSubchapterId);
                    setCurrentSectionId("");
                    notifyChange(bookId, chapterId, newSubchapterId, "");
                }}
            >

                <option value="">
                    Alla delkapitel
                </option>

                {subchapters.map(
                    subchapter => (

                        <option
                            key={subchapter.id}
                            value={subchapter.id}
                        >
                            {
                                subchapter.subchapter_number
                            }
                            {" "}
                            {subchapter.title}
                        </option>

                    )
                )}

            </select>

            <select
                className="input-standard"
                value={currentSectionId}
                onChange={(e) => {
                    const newSectionId = e.target.value;
                    setCurrentSectionId(newSectionId);
                    notifyChange(bookId, chapterId, subchapterId, newSectionId);
                }}
            >

                <option value="">
                    Alla avsnitt
                </option>

                {sections.map(section => (

                    <option
                        key={section.id}
                        value={section.id}
                    >
                        {section.title}
                    </option>

                ))}

            </select>

        </TabPanelSection>      
    );

}