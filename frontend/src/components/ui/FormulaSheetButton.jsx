import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Draggable from "react-draggable";
import { BookOpen } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

import { Button } from "@/components/ui/button";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function getCourseLabel(group) {
    return group?.level_code || group?.level_name || group?.subject_name;
}

function getFormulaSheetUrl(group) {
    const course = [group?.level_code, group?.level_name, group?.subject_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (/forts[aä]ttning\s*(niv[aå]\s*)?1|forts\s*(niv[aå]\s*)?1|matematik\s*3|ma\s*3|matmat0?3[bc]|\b3\s*[bc]\b/i.test(course)) {
        return "/formula-sheets/formelblad-matematik-3bc-fortsattning-niva-1.pdf";
    }

    if (/forts[aä]ttning\s*(niv[aå]\s*)?2|forts\s*(niv[aå]\s*)?2|matematik\s*4|ma\s*4|matmat0?4|\b4\b/i.test(course)) {
        return "/formula-sheets/formelblad-matematik-4-fortsattning-niva-2.pdf";
    }

    if (/matematik(?:\s+\d+)?(?:\s*5000\s*\+)?\s*2\s*[abc]|ma\s*2\s*[abc]|matmat0?2[abc]|\b2\s*[abc]\b/i.test(course)) {
        return "/formula-sheets/formelblad-matematik-2abc-2021.pdf";
    }

    if (/matematik\s*1\s*[abc]|ma\s*1\s*[abc]|\b1\s*[abc]\b/i.test(course)) {
        return "/formula-sheets/formelblad-matematik-1abc.pdf";
    }

    return "/formula-sheets/formelblad-matematik-1abc.pdf";
}

function FormulaPdfDocument({ url, penEnabled, eraseEnabled, clearSignal }) {
    const [pdfDocument, setPdfDocument] = useState(null);
    const [pages, setPages] = useState([]);
    const [loadError, setLoadError] = useState(null);
    const pdfCanvasRefs = useRef([]);
    const noteCanvasRefs = useRef([]);
    const drawingPageRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setPdfDocument(null);
        setPages([]);
        setLoadError(null);

        pdfjsLib.getDocument({ url }).promise
            .then(document => {
                if (!cancelled) {
                    setPdfDocument(document);
                    setPages(Array.from({ length: document.numPages }, (_, index) => index + 1));
                }
            })
            .catch(error => {
                console.error("Kunde inte läsa formelblad", error);
                if (!cancelled) {
                    setLoadError(`Formelbladet kunde inte läsas in: ${error.message}`);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [url]);

    useEffect(() => {
        if (!pdfDocument) {
            return undefined;
        }

        let cancelled = false;

        const renderPages = async () => {
            for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
                const page = await pdfDocument.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1.35 });
                const pdfCanvas = pdfCanvasRefs.current[pageNumber - 1];
                const noteCanvas = noteCanvasRefs.current[pageNumber - 1];

                if (cancelled || !pdfCanvas || !noteCanvas) {
                    continue;
                }

                pdfCanvas.width = viewport.width;
                pdfCanvas.height = viewport.height;
                noteCanvas.width = viewport.width;
                noteCanvas.height = viewport.height;
                noteCanvas.style.width = `${viewport.width}px`;
                noteCanvas.style.height = `${viewport.height}px`;

                await page.render({
                    canvasContext: pdfCanvas.getContext("2d"),
                    viewport
                }).promise;

                const savedNotes = localStorage.getItem(
                    `math-camp-formula-notes-${url}-${pageNumber}`
                );

                if (savedNotes) {
                    const image = new Image();
                    image.onload = () => noteCanvas.getContext("2d").drawImage(image, 0, 0);
                    image.src = savedNotes;
                }
            }
        };

        renderPages().catch(error => console.error("Kunde inte rendera formelblad", error));

        return () => {
            cancelled = true;
        };
    }, [pdfDocument, url]);

    useEffect(() => {
        if (!clearSignal) {
            return;
        }

        noteCanvasRefs.current.forEach(canvas => {
            canvas?.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        });

        pages.forEach(pageNumber => {
            localStorage.removeItem(`math-camp-formula-notes-${url}-${pageNumber}`);
        });
    }, [clearSignal, pages, url]);

    const startDrawing = (event, pageIndex) => {
        if (!penEnabled) {
            return;
        }

        const canvas = noteCanvasRefs.current[pageIndex];
        const bounds = canvas.getBoundingClientRect();
        const context = canvas.getContext("2d");
        drawingPageRef.current = pageIndex;
        canvas.setPointerCapture(event.pointerId);
        context.strokeStyle = "#dc2626";
        context.globalCompositeOperation = eraseEnabled ? "destination-out" : "source-over";
        context.lineWidth = eraseEnabled ? 18 : 3;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(event.clientX - bounds.left, event.clientY - bounds.top);
    };

    const draw = (event, pageIndex) => {
        if (drawingPageRef.current !== pageIndex) {
            return;
        }

        const canvas = noteCanvasRefs.current[pageIndex];
        const bounds = canvas.getBoundingClientRect();
        const context = canvas.getContext("2d");
        context.lineTo(event.clientX - bounds.left, event.clientY - bounds.top);
        context.stroke();
    };

    const stopDrawing = (event, pageIndex) => {
        if (drawingPageRef.current !== pageIndex) {
            return;
        }

        const canvas = noteCanvasRefs.current[pageIndex];
        canvas.releasePointerCapture?.(event.pointerId);
        drawingPageRef.current = null;
        localStorage.setItem(
            `math-camp-formula-notes-${url}-${pageIndex + 1}`,
            canvas.toDataURL()
        );
    };

    if (loadError) {
        return <div className="p-6 text-sm text-destructive">{loadError}</div>;
    }

    if (!pdfDocument) {
        return <div className="p-6 text-sm text-muted-foreground">Laddar formelblad...</div>;
    }

    return (
        <div className="h-full overflow-auto bg-muted/20 p-3">
            <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4">
                {pages.map((pageNumber, pageIndex) => (
                    <div key={pageNumber} className="relative bg-white shadow">
                        <canvas ref={canvas => { pdfCanvasRefs.current[pageIndex] = canvas; }} />
                        <canvas
                            ref={canvas => { noteCanvasRefs.current[pageIndex] = canvas; }}
                            className={penEnabled ? "absolute left-0 top-0 cursor-crosshair" : "pointer-events-none absolute left-0 top-0"}
                            style={{ touchAction: "none" }}
                            onPointerDown={event => startDrawing(event, pageIndex)}
                            onPointerMove={event => draw(event, pageIndex)}
                            onPointerUp={event => stopDrawing(event, pageIndex)}
                            onPointerCancel={event => stopDrawing(event, pageIndex)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

class FormulaPdfErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div className="p-6 text-sm text-destructive">
                    Formelbladet kunde inte visas: {this.state.error.message}
                </div>
            );
        }

        return this.props.children;
    }
}

export default function FormulaSheetButton({ group = {}, title = "Formelblad", iconOnly = false }) {
    const [activeFormula, setActiveFormula] = useState(null);
    const [penEnabled, setPenEnabled] = useState(false);
    const [eraseEnabled, setEraseEnabled] = useState(false);
    const [clearSignal, setClearSignal] = useState(0);
    const [formulaPosition, setFormulaPosition] = useState({ x: 0, y: 0 });
    const formulaRef = useRef(null);

    const openFormula = () => {
        setFormulaPosition({ x: 0, y: 0 });
        setActiveFormula({
            name: group?.name || "Matematik",
            course: getCourseLabel(group) || "Matematik",
            url: getFormulaSheetUrl(group)
        });
        setPenEnabled(false);
        setEraseEnabled(false);
    };

    const centerFormula = () => {
        const width = Math.min(900, window.innerWidth - 32);
        const height = Math.min(760, window.innerHeight - 32);

        setFormulaPosition({
            x: Math.max(0, (window.innerWidth - width) / 2 - 16),
            y: Math.max(0, (window.innerHeight - height) / 2 - 64)
        });
    };

    const formulaPanel = activeFormula && createPortal(
        <Draggable
            handle=".formula-sheet-drag-handle"
            cancel=".formula-sheet-controls"
            nodeRef={formulaRef}
            position={formulaPosition}
            onStop={(_event, data) => setFormulaPosition({ x: data.x, y: data.y })}
        >
            <section
                ref={formulaRef}
                className="fixed left-4 top-16 z-[9997] w-[min(900px,calc(100vw-2rem))] rounded-lg border bg-background p-3 shadow-2xl"
                aria-label={`Formelblad ${activeFormula.course}`}
            >
                <div className="formula-sheet-drag-handle mb-3 flex cursor-move items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
                    <div>
                        <div className="text-sm font-medium">{activeFormula.name}</div>
                        <div className="text-xs text-muted-foreground">Formelblad {activeFormula.course}</div>
                    </div>
                    <div className="formula-sheet-controls flex items-center gap-2">
                        <Button type="button" variant={penEnabled && !eraseEnabled ? "default" : "outline"} size="sm" onClick={() => {
                            setPenEnabled(true);
                            setEraseEnabled(false);
                        }}>
                            Penna
                        </Button>
                        <Button type="button" variant={penEnabled && eraseEnabled ? "default" : "outline"} size="sm" onClick={() => {
                            setPenEnabled(true);
                            setEraseEnabled(true);
                        }}>
                            Sudda
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setClearSignal(value => value + 1)}>
                            Rensa
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setActiveFormula(null)} aria-label="Stäng formelblad">
                            ×
                        </Button>
                    </div>
                </div>
                <div className="h-[min(75vh,700px)] w-full overflow-hidden rounded border">
                    <FormulaPdfErrorBoundary>
                        <FormulaPdfDocument
                            url={activeFormula.url}
                            penEnabled={penEnabled}
                            eraseEnabled={eraseEnabled}
                            clearSignal={clearSignal}
                        />
                    </FormulaPdfErrorBoundary>
                </div>
            </section>
        </Draggable>,
        document.body
    );

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size={iconOnly ? "icon" : "default"}
                aria-label={title}
                title={title}
                className={activeFormula
                    ? "border-green-600 bg-green-600 text-white hover:bg-green-700 hover:text-white"
                    : "bg-white"}
                onClick={event => {
                    if (event.detail !== 2) {
                        activeFormula ? setActiveFormula(null) : openFormula();
                    }
                }}
                onDoubleClick={() => {
                    if (!activeFormula) {
                        openFormula();
                    }
                    centerFormula();
                }}
            >
                <BookOpen className="h-4 w-4" />
                {!iconOnly && title}
            </Button>
            {formulaPanel}
        </>
    );
}