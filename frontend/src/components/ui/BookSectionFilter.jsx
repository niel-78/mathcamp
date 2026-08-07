import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import TabPanelSection from "@/components/layouts/TabPanelSection";


export default function BookSectionFilter({
    sectionId,
    onSectionChange
}) {

    const [books, setBooks] =
        useState([]);

    const [bookId, setBookId] =
        useState("");

    const [chapterId, setChapterId] =
        useState("");

    const [subchapterId, setSubchapterId] =
        useState("");

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
                    book.chapters
            );
            
    const subchapters =

        chapterId

            ? selectedChapter?.subchapters ?? []

            : chapters.flatMap(
                chapter =>
                    chapter.subchapters
            );

    const sections =

        subchapterId

            ? selectedSubchapter?.sections ?? []

            : subchapters.flatMap(
                subchapter =>
                    subchapter.sections
            );
    
    return (

        <TabPanelSection
            title="Filtrera på avsnitt i matematikbok"
            description="
                Hitta block utifrån
                kapitel, delkapitel och avsnitt.
            "
        >

            <select
                className="input-standard"
                value={bookId}
                onChange={(e) => {

                    setBookId(
                        e.target.value
                    );

                    setChapterId("");
                    setSubchapterId("");
                    onSectionChange("");

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

                    setChapterId(
                        e.target.value
                    );

                    setSubchapterId("");
                    onSectionChange("");

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

                    setSubchapterId(
                        e.target.value
                    );

                    onSectionChange("");

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
                value={sectionId}
                onChange={(e) =>
                    onSectionChange(
                        e.target.value
                    )
                }
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