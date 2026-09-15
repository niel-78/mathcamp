import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

function getMediaUrl(mediaUrl) {
    if (!mediaUrl) {
        return null;
    }

    return mediaUrl.startsWith("http")
        ? mediaUrl
        : `${API_URL}${mediaUrl.startsWith("/") ? "" : "/"}${mediaUrl}`;
}

export default function MathQuestionMedia({ media = [], attemptId }) {
    const [activeMedia, setActiveMedia] = useState(null);
    const [penEnabled, setPenEnabled] = useState(false);
    const [eraseEnabled, setEraseEnabled] = useState(false);
    const [clearSignal, setClearSignal] = useState(0);
    const imageRef = useRef(null);
    const noteCanvasRef = useRef(null);
    const drawingRef = useRef(false);

    const imageMedia = (Array.isArray(media) ? media : []).filter(item =>
        item && (
            item.media_type?.startsWith("image/") ||
            item.media_type === "image"
        )
    );

    useEffect(() => {
        if (!activeMedia || !imageRef.current || !noteCanvasRef.current) {
            return;
        }

        const image = imageRef.current;
        const canvas = noteCanvasRef.current;
        const setupCanvas = () => {
            if (!image.naturalWidth || !image.naturalHeight) {
                return;
            }

            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const loadNotes = async () => {
                const response = attemptId
                    ? await fetch(
                        `${API_URL}/api/assessment-attempts/${attemptId}/question-image-notes/${activeMedia.id}`,
                        { headers: authHeaders() }
                    )
                    : null;
                const data = response?.ok ? await response.json() : null;
                const savedNotes = data?.notes_data || localStorage.getItem(
                    `math-camp-question-image-notes-${activeMedia.id}`
                );

                if (savedNotes) {
                    const savedImage = new Image();
                    savedImage.onload = () => {
                        const context = canvas.getContext("2d");
                        context?.drawImage(savedImage, 0, 0);
                    };
                    savedImage.src = savedNotes;
                }
            };

            loadNotes().catch(error => {
                console.error("Kunde inte hämta bildanteckningar", error);
            });
        };

        if (image.complete) {
            setupCanvas();
        } else {
            image.addEventListener("load", setupCanvas, { once: true });
            return () => image.removeEventListener("load", setupCanvas);
        }
    }, [activeMedia, attemptId]);

    useEffect(() => {
        if (!clearSignal || !noteCanvasRef.current || !activeMedia) {
            return;
        }

        const canvas = noteCanvasRef.current;
        const context = canvas.getContext("2d");
        context?.clearRect(0, 0, canvas.width, canvas.height);
        localStorage.removeItem(`math-camp-question-image-notes-${activeMedia.id}`);

        if (attemptId) {
            fetch(
                `${API_URL}/api/assessment-attempts/${attemptId}/question-image-notes/${activeMedia.id}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        question_id: activeMedia.question_id,
                        notes_data: ""
                    })
                }
            ).catch(error => console.error("Kunde inte rensa bildanteckningar", error));
        }
    }, [activeMedia, attemptId, clearSignal]);

    const getCanvasPoint = event => {
        const canvas = noteCanvasRef.current;
        const bounds = canvas.getBoundingClientRect();

        if (!bounds.width || !bounds.height || !canvas.width || !canvas.height) {
            return null;
        }

        return {
            x: (event.clientX - bounds.left) * canvas.width / bounds.width,
            y: (event.clientY - bounds.top) * canvas.height / bounds.height
        };
    };

    const startDrawing = event => {
        if (!penEnabled || !noteCanvasRef.current) {
            return;
        }

        const canvas = noteCanvasRef.current;
        const context = canvas.getContext("2d");
        const point = getCanvasPoint(event);
        if (!context || !point) {
            return;
        }

        drawingRef.current = true;
        canvas.setPointerCapture(event.pointerId);
        context.strokeStyle = "#dc2626";
        context.globalCompositeOperation = eraseEnabled
            ? "destination-out"
            : "source-over";
        context.lineWidth = eraseEnabled ? 28 : 3;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(point.x, point.y);
    };

    const draw = event => {
        if (!drawingRef.current || !noteCanvasRef.current) {
            return;
        }

        const point = getCanvasPoint(event);
        const context = noteCanvasRef.current.getContext("2d");
        if (!context || !point) {
            return;
        }

        context.lineTo(point.x, point.y);
        context.stroke();
    };

    const stopDrawing = event => {
        if (!drawingRef.current || !noteCanvasRef.current) {
            return;
        }

        const canvas = noteCanvasRef.current;
        canvas.releasePointerCapture?.(event.pointerId);
        drawingRef.current = false;
        const notesData = canvas.toDataURL();
        localStorage.setItem(`math-camp-question-image-notes-${activeMedia.id}`, notesData);

        if (attemptId) {
            fetch(
                `${API_URL}/api/assessment-attempts/${attemptId}/question-image-notes/${activeMedia.id}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        question_id: activeMedia.question_id,
                        notes_data: notesData
                    })
                }
            ).catch(error => console.error("Kunde inte spara bildanteckningar", error));
        }
    };

    const openMedia = item => {
        setActiveMedia(item);
        setPenEnabled(false);
        setEraseEnabled(false);
    };

    const closeMedia = () => {
        setActiveMedia(null);
        setPenEnabled(false);
        setEraseEnabled(false);
    };

    if (imageMedia.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 flex flex-col items-center gap-3">
            {imageMedia.map(item => {
                const src = getMediaUrl(item.media_url);

                return src ? (
                    <button
                        key={item.id}
                        type="button"
                        className="block cursor-zoom-in rounded-md text-left"
                        onClick={() => openMedia(item)}
                        aria-label="Öppna bilden för att anteckna"
                    >
                        <img
                            src={src}
                            alt="Bild till uppgiften"
                            className="max-h-40 max-w-[16rem] rounded-md border object-contain"
                        />
                    </button>
                ) : null;
            })}

            <Dialog open={!!activeMedia} onOpenChange={open => !open && closeMedia()}>
                <DialogContent
                    className="h-auto max-h-[94vh] !w-max !max-w-[calc(100vw-1rem)] gap-3 p-3"
                    showCloseButton={false}
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>Bild till uppgiften</DialogTitle>
                        <DialogDescription>
                            Skriv anteckningar direkt på bilden.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant={penEnabled && !eraseEnabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                setPenEnabled(true);
                                setEraseEnabled(false);
                            }}
                        >
                            Penna
                        </Button>
                        <Button
                            type="button"
                            variant={penEnabled && eraseEnabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                setPenEnabled(true);
                                setEraseEnabled(true);
                            }}
                        >
                            Sudda
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setClearSignal(value => value + 1)}
                        >
                            Rensa
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={closeMedia}
                        >
                            Stäng
                        </Button>
                    </div>

                    {activeMedia && (
                        <div className="max-h-[calc(94vh-7rem)] max-w-[calc(100vw-2rem)] overflow-auto rounded border bg-muted/20 p-2">
                            <div className="relative mx-auto h-fit w-fit max-w-full bg-white shadow">
                                <img
                                    ref={imageRef}
                                    src={getMediaUrl(activeMedia.media_url)}
                                    alt="Bild till uppgiften"
                                    className="block h-auto w-auto max-h-[calc(94vh-7rem)] max-w-[calc(100vw-2rem)] object-contain"
                                />
                                <canvas
                                    ref={noteCanvasRef}
                                    className={penEnabled
                                        ? "absolute left-0 top-0 h-full w-full cursor-crosshair"
                                        : "pointer-events-none absolute left-0 top-0 h-full w-full"}
                                    style={{ touchAction: "none" }}
                                    onPointerDown={startDrawing}
                                    onPointerMove={draw}
                                    onPointerUp={stopDrawing}
                                    onPointerCancel={stopDrawing}
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function SavedQuestionImage({ media }) {
    const src = getMediaUrl(media?.media_url);

    if (!src) {
        return null;
    }

    return (
        <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-md border bg-white">
            <img
                src={src}
                alt="Bild till uppgiften"
                className="block max-h-80 max-w-full object-contain"
            />
            {media.notes_data && (
                <img
                    src={media.notes_data}
                    alt="Elevens anteckningar"
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                />
            )}
        </div>
    );
}