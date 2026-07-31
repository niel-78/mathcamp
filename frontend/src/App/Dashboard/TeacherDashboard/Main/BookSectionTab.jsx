import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function BookSectionTab({
    sectionId
}) {

    const [section, setSection] =
        useState(null);

    useEffect(() => {

        loadSection();

    }, [sectionId]);

    const loadSection = async () => {

        const response = await fetch(
            `${API_URL}/api/books/sections/${sectionId}`
        );

        const data =
            await response.json();

        setSection(data);

    };

    if (!section) {

        return (
            <div className="p-6">
                Laddar...
            </div>
        );

    }

    return (

        <div className="p-6">

            <h1 className="text-3xl font-bold mb-2">
                {section.title}
            </h1>

            <div className="text-sm text-slate-500 mb-6">

                {section.chapter_number}
                {" "}
                {section.chapter_title}

                {" → "}

                {
                    section.subchapter_number
                }

                {" "}

                {
                    section.subchapter_title
                }

            </div>

            <div
                className="
                    rounded-lg
                    border
                    p-4
                    bg-white
                "
            >

                <p>
                    Inget innehåll ännu.
                </p>

            </div>

        </div>

    );

}