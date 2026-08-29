import { useMemo, useState } from "react";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { Button } from "@/components/ui/button";
import MathContent from "@/components/ui/MathContent";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

export default function PresentationEditorTab({
    presentation,
    openTab
}) {

    const data =
        useMemo(() => {

            try {

                return JSON.parse(
                    presentation?.content || "{}"
                );

            } catch {

                return {
                    slides: []
                };

            }

        }, [presentation]);

    const [slides, setSlides] =
        useState(
            data.slides || []
        );

    const updateSlide = (
        index,
        field,
        value
    ) => {

        setSlides(prev =>
            prev.map(
                (slide, i) =>
                    i === index
                        ? {
                            ...slide,
                            [field]: value
                        }
                        : slide
            )
        );
    };

    const addSlide = () => {

        setSlides(prev => [
            ...prev,
            {
                type: "question",
                title: "Exempel",
                question: ""
            }
        ]);

    };

    const removeSlide = index => {

        setSlides(prev =>
            prev.filter(
                (_, i) =>
                    i !== index
            )
        );

    };

    const savePresentation =
        async () => {

            await fetch(
                `${API_URL}/api/presentations/${presentation.id}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        title:
                            presentation.title,
                        content:
                            JSON.stringify({
                                slides
                            }),
                        section_id:
                            presentation.section_id
                    })
                }
            );

            toast.success(
                "Presentation sparad"
            );

        };


    return (

        <BaseTabLayout

            title="Presentation"

            actions={
                <div className="flex gap-2">

                    <Button
                        variant="outline"
                        onClick={() =>
                            openTab({
                                id:
                                    `presentation-player-${presentation.id}`,
                                title:
                                    `${presentation.title} (Visa)`,
                                type:
                                    "presentation-player",
                                presentationId:
                                    presentation.id
                            })
                        }
                    >
                        Visa
                    </Button>
                    <Button
                        variant="outline"
                        onClick={addSlide}
                    >
                        Ny slide
                    </Button>
                    <Button
                        onClick={savePresentation}
                    >
                        Spara
                    </Button>

                </div>
            }

        >

            <div className="space-y-6">

                {slides.map(
                    (slide, index) => (

                        <div

                            key={index}

                            className="
                                rounded-lg
                                border
                                bg-card
                                p-6
                                shadow-sm
                            "

                        >

                            <div
                                className="
                                    mb-4
                                    text-sm
                                    text-muted-foreground
                                "
                            >
                                Slide {index + 1}
                            </div>

                            {slide.type === "title" && (
                                <div className="py-16 text-center space-y-4">

                                    <h1 className="text-5xl font-bold">
                                        {slide.book}
                                    </h1>

                                    <div className="text-2xl">
                                        {slide.chapter}
                                    </div>

                                    <div className="text-xl">
                                        {slide.subchapter}
                                    </div>

                                    <div className="text-lg text-muted-foreground">
                                        {slide.section}
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        Sidorna: {slide.startPage}–{slide.endPage}
                                    </div>

                                </div>
                            )}                            

                            {slide.type === "question" && (
                                <div className="space-y-6">

                                    <input
                                        className="
                                            w-full
                                            rounded
                                            border
                                            p-2
                                        "
                                        value={slide.title || ""}
                                        onChange={(e) =>
                                            updateSlide(
                                                index,
                                                "title",
                                                e.target.value
                                            )
                                        }
                                    />

                                    <div
                                        className="
                                            rounded-md
                                            border
                                            p-4
                                            text-xl
                                        "
                                    >
                                        <textarea
                                            className="
                                                w-full
                                                rounded
                                                border
                                                p-2
                                                mb-4
                                            "
                                            rows={4}
                                            value={slide.question || ""}
                                            onChange={(e) =>
                                                updateSlide(
                                                    index,
                                                    "question",
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <MathContent
                                            value={slide.question}
                                        />
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                removeSlide(index)
                                            }
                                        >
                                            Ta bort
                                        </Button>
                                    </div>

                                </div>
                            )}

                        </div>

                    )
                )}

            </div>

        </BaseTabLayout>

    );

}