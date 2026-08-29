import { useEffect, useState } from "react";
import { useRef } from "react";
import "katex/dist/katex.min.css";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import QuestionSlide from "@/components/presentation/QuestionSlide";
import TitleSlide from "@/components/presentation/TitleSlide";
import GoalsSlide from "@/components/presentation/GoalsSlide";

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

    const presentationRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {

        loadPresentation();

    }, [presentationId]);


    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(
                document.fullscreenElement === presentationRef.current
            );
        };

        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange
        );

        return () =>
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
    }, []);

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

        let content = data.content;

        if (typeof content === "string") {

            try {

                content = JSON.parse(content);

            } catch {

                content = {
                    slides: []
                };

            }

        }

        setSlides(
            content.slides || []
        );

    }

    function fullscreen() {
        presentationRef.current?.requestFullscreen();
    }

    if (
        !presentation
    ) {

        return null;

    }

    function renderSlide(slide) {

        switch (slide.type) {

            case "title":

                return (
                    <TitleSlide slide={slide} />
                );

            case "goals":

                return (
                    <GoalsSlide
                        slide={slide}
                    />
                );

            case "question":

                return (
                    <QuestionSlide 
                        slide={slide} 
                        isFullscreen={isFullscreen}
                    />
                );

            default:

                return null;
        }

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
                ref={presentationRef}
                className={
                    isFullscreen
                        ? "presentation-shell-fullscreen"
                        : "presentation-shell"
                }
            >

                <div
                    className={
                        isFullscreen
                            ? "presentation-slide-fullscreen"
                            : "presentation-slide"
                    }
                >

                    <div
                        className={
                            isFullscreen
                                ? "prose prose-2xl max-w-none dark:prose-invert"
                                : "prose prose-lg max-w-none dark:prose-invert"
                        }
                    >

                    {renderSlide(
                        slides[slideIndex]
                    )}

                    </div>
                    
                </div>

                <div
                    className={
                        isFullscreen
                            ? "presentation-counter-fullscreen"
                            : "presentation-counter"
                    }
                >
                    Slide {slideIndex + 1} / {slides.length}
                </div>

            </div>

        </BaseTabLayout>

    );

}