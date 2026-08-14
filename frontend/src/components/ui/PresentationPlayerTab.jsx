import {
    useEffect,
    useState
} from "react";

import ReactMarkdown
    from "react-markdown";

import remarkMath
    from "remark-math";

import rehypeKatex
    from "rehype-katex";

import "katex/dist/katex.min.css";

import BaseTabLayout
    from "@/components/layouts/BaseTabLayout";

import {
    Button
} from "@/components/ui/button";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

export default function PresentationPlayerTab({
    presentationId
}) {

    const [
        presentation,
        setPresentation
    ] = useState(null);

    const [
        slides,
        setSlides
    ] = useState([]);

    const [
        slideIndex,
        setSlideIndex
    ] = useState(0);

    useEffect(() => {

        loadPresentation();

    }, [presentationId]);

    useEffect(() => {

        const handleKeyDown =
            event => {

                if (
                    event.key ===
                    "ArrowRight"
                ) {

                    setSlideIndex(
                        current =>
                            Math.min(
                                current + 1,
                                slides.length - 1
                            )
                    );

                }

                if (
                    event.key ===
                    "ArrowLeft"
                ) {

                    setSlideIndex(
                        current =>
                            Math.max(
                                current - 1,
                                0
                            )
                    );

                }

                if (
                    event.key ===
                    "Home"
                ) {

                    setSlideIndex(0);

                }

                if (
                    event.key ===
                    "End"
                ) {

                    setSlideIndex(
                        slides.length - 1
                    );

                }

            };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () =>
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

    }, [slides.length]);

    async function loadPresentation() {

        const response = await fetch(
            `${API_URL}/api/presentations/${presentationId}`,
            {
                headers: authHeaders()
            }
        );

        const data =
            await response.json();

        setPresentation(data);

        setSlides(
            data.content
                .split(/\n---\n/)
                .map(
                    slide =>
                        slide.trim()
                )
                .filter(Boolean)
        );

    }

    function fullscreen() {

        document.documentElement
            .requestFullscreen();

    }

    if (
        !presentation
    ) {

        return null;

    }

    return (

        <BaseTabLayout

            title={
                presentation.title
            }

            actions={
                <div className="flex gap-2">

                    <Button
                        variant="outline"
                        onClick={() =>
                            setSlideIndex(
                                current =>
                                    Math.max(
                                        current - 1,
                                        0
                                    )
                            )
                        }
                    >
                        ←
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() =>
                            setSlideIndex(
                                current =>
                                    Math.min(
                                        current + 1,
                                        slides.length - 1
                                    )
                            )
                        }
                    >
                        →
                    </Button>

                    <Button
                        onClick={
                            fullscreen
                        }
                    >
                        Fullskärm
                    </Button>

                </div>
            }

        >

            <div
                className="
                    mx-auto
                    max-w-5xl
                    p-8
                "
            >

                <div
                    className="
                        min-h-[70vh]
                        rounded-lg
                        border
                        bg-background
                        p-10
                        prose
                        prose-lg
                        max-w-none
                    "
                >

                    <ReactMarkdown
                        remarkPlugins={[
                            remarkMath
                        ]}
                        rehypePlugins={[
                            rehypeKatex
                        ]}
                    >
                        {
                            slides[
                                slideIndex
                            ] || ""
                        }
                    </ReactMarkdown>

                </div>

                <div
                    className="
                        mt-4
                        text-center
                        text-sm
                        text-muted-foreground
                    "
                >

                    Slide {" "}
                    {slideIndex + 1}
                    {" / "}
                    {slides.length}

                </div>

            </div>

        </BaseTabLayout>

    );

}