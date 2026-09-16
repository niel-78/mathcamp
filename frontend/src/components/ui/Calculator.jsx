import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { evaluate } from "mathjs";
import Draggable from "react-draggable";
import { Calculator as CalculatorIcon, Delete, Grip, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

const calculatorKeys = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ",", "", "+"]
];

const calculatorPositionStorageKey = "math-camp-calculator-position";
const calculatorSizeStorageKey = "math-camp-calculator-size";
const geogebraScriptUrl = "https://www.geogebra.org/apps/deployggb.js";
const defaultGeoGebraSize = {
    width: 720,
    height: 520
};

function getSavedPosition() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(calculatorPositionStorageKey) || "null"
        );

        if (
            Number.isFinite(saved?.x) &&
            Number.isFinite(saved?.y)
        ) {
            return {
                x: saved.x,
                y: saved.y
            };
        }
    } catch {
        // Use the default position when localStorage is unavailable or invalid.
    }

    return {
        x: 0,
        y: 0
    };
}

function getSavedSize() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(calculatorSizeStorageKey) || "null"
        );

        if (saved && Number.isFinite(saved.width) && Number.isFinite(saved.height)) {
            return {
                width: Math.max(320, saved.width),
                height: Math.max(320, saved.height)
            };
        }
    } catch {
        // Ignore invalid saved size.
    }

    return defaultGeoGebraSize;
}

function formatResult(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(Number(value.toFixed(12)).toString()).replace(".", ",");
    }

    return String(value).replace(".", ",");
}

export default function Calculator({
    showCalculator = true,
    showGeoGebra = true,
    attemptId = null,
    questionId = null
}) {
    const anchorRef = useRef(null);
    const calculatorRef = useRef(null);
    const geogebraContainerRef = useRef(null);
    const geogebraAppletRef = useRef(null);
    const lastSavedGeoGebraXml = useRef("");
    const savedPosition = useRef(getSavedPosition());
    const savedSize = useRef(getSavedSize());
    const geogebraContainerId = `geogebra-${useId().replace(/:/g, "")}`;
    const [open, setOpen] = useState(false);
    const [activeTool, setActiveTool] = useState(showGeoGebra && !showCalculator ? "geogebra" : "calculator");
    const [expression, setExpression] = useState("");
    const [result, setResult] = useState("");
    const [geogebraSize, setGeogebraSize] = useState(savedSize.current);
    const [panelPosition, setPanelPosition] = useState(savedPosition.current);
    const [geogebraReady, setGeogebraReady] = useState(false);
    const [geogebraName, setGeogebraName] = useState(
        attemptId && questionId
            ? "Provkonstruktion"
            : "Min GeoGebra-konstruktion"
    );
    const [panelAnchor, setPanelAnchor] = useState(null);
    const canPersistGeoGebra = Boolean(attemptId && questionId);
    const geogebraStorageUrl = attemptId && questionId
        ? `${API_URL}/api/assessment-attempts/${attemptId}/geogebra/${questionId}`
        : `${API_URL}/api/geogebra-constructions`;

    const updatePanelAnchor = () => {
        if (!anchorRef.current) {
            return;
        }

        const rect = anchorRef.current.getBoundingClientRect();

        setPanelAnchor({
            top: Math.min(rect.bottom + 8, window.innerHeight - 48),
            right: Math.max(16, window.innerWidth - rect.right)
        });
    };

    const handleUnauthorized = async (response) => {
        if (response.status !== 401) {
            return false;
        }

        let message = "GeoGebra kunde inte verifiera din inloggning. Konstruktionen sparades inte.";

        try {
            const data = await response.clone().json();
            if (data.error === "No token") {
                message = "Ingen inloggningstoken hittades. Logga in igen.";
            }
        } catch {
            // Keep the generic authentication message when the response has no JSON body.
        }

        toast.error(message);
        return true;
    };

    useEffect(() => {
        if (!open || activeTool !== "geogebra" || !geogebraContainerRef.current) {
            return undefined;
        }

        let cancelled = false;

        const loadScript = () => new Promise((resolve, reject) => {
            if (window.GGBApplet) {
                resolve();
                return;
            }

            const existingScript = document.querySelector(
                `script[src="${geogebraScriptUrl}"]`
            );

            if (existingScript) {
                existingScript.addEventListener("load", resolve, { once: true });
                existingScript.addEventListener("error", reject, { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = geogebraScriptUrl;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        const initializeApplet = async () => {
            try {
                await loadScript();

                if (cancelled || !geogebraContainerRef.current) {
                    return;
                }

                geogebraContainerRef.current.replaceChildren();

                const applet = new window.GGBApplet({
                    appName: "suite",
                    width: savedSize.current.width,
                    height: savedSize.current.height,
                    showToolBar: true,
                    showAlgebraInput: true,
                    showMenuBar: false,
                    showResetIcon: true,
                    enableLabelDrags: true,
                    showZoomButtons: true,
                    allowStyleBar: true,
                    language: "sv",
                    appletOnLoad: async loadedApplet => {
                        if (cancelled) {
                            return;
                        }

                        geogebraAppletRef.current = loadedApplet;
                        setGeogebraReady(true);

                        if (canPersistGeoGebra) {
                            const response = await fetch(
                                `${API_URL}/api/assessment-attempts/${attemptId}/geogebra/${questionId}`,
                                { headers: authHeaders() }
                            );

                            if (await handleUnauthorized(response)) {
                                return;
                            }

                            const data = await response.json();

                            if (response.ok && data.construction?.construction_xml) {
                                setGeogebraName(
                                    data.construction.name || geogebraName
                                );
                                loadedApplet.setXML(data.construction.construction_xml);
                            }
                        }

                        lastSavedGeoGebraXml.current = loadedApplet.getXML();
                    }
                }, true);

                applet.inject(geogebraContainerId);
            } catch (error) {
                console.error(error);
                toast.error("GeoGebra kunde inte laddas.");
            }
        };

        setGeogebraReady(false);
        initializeApplet();

        return () => {
            cancelled = true;
            geogebraAppletRef.current = null;
            setGeogebraReady(false);
        };
    }, [activeTool, attemptId, canPersistGeoGebra, geogebraContainerId, open, questionId]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        updatePanelAnchor();
        window.addEventListener("resize", updatePanelAnchor);
        window.addEventListener("scroll", updatePanelAnchor, true);

        return () => {
            window.removeEventListener("resize", updatePanelAnchor);
            window.removeEventListener("scroll", updatePanelAnchor, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open || activeTool !== "geogebra" || !geogebraReady) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            const applet = geogebraAppletRef.current;
            const currentXml = applet?.getXML?.();

            if (!applet || !currentXml || currentXml === lastSavedGeoGebraXml.current) {
                return;
            }

            saveGeoGebra(true);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [activeTool, geogebraName, geogebraReady, open]);

    const append = (value) => {
        setExpression(current => `${current}${value}`);
        setResult("");
    };

    const calculate = () => {
        if (!expression.trim() || !/^[0-9+\-*/(),\s]+$/.test(expression)) {
            setResult("Ogiltigt uttryck");
            return;
        }

        try {
            setResult(
                formatResult(
                    evaluate(expression.replaceAll(",", "."))
                )
            );
        } catch {
            setResult("Ogiltigt uttryck");
        }
    };

    const clear = () => {
        setExpression("");
        setResult("");
    };

    const removeLast = () => {
        setExpression(current => current.slice(0, -1));
        setResult("");
    };

    async function saveGeoGebra(silent = false) {
        if (!geogebraAppletRef.current) {
            return;
        }

        try {
            const response = await fetch(
                geogebraStorageUrl,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({
                        name: geogebraName,
                        construction_xml: geogebraAppletRef.current.getXML()
                    })
                }
            );

            if (await handleUnauthorized(response)) {
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Kunde inte spara konstruktionen.");
            }

            lastSavedGeoGebraXml.current = geogebraAppletRef.current.getXML();

            if (!silent) {
                toast.success("GeoGebra-konstruktionen sparades.");
            }
        } catch (error) {
            console.error(error);
            if (!silent) {
                toast.error(error.message || "Kunde inte spara konstruktionen.");
            }
        }
    }

    const resizeGeoGebra = (widthChange, heightChange) => {
        const nextWidth = Math.min(
            1400,
            Math.max(320, savedSize.current.width + widthChange)
        );
        const nextHeight = Math.min(
            1000,
            Math.max(320, savedSize.current.height + heightChange)
        );

        savedSize.current = {
            width: nextWidth,
            height: nextHeight
        };

        setGeogebraSize(savedSize.current);
        geogebraAppletRef.current?.setSize?.(nextWidth, nextHeight);

        if (geogebraContainerRef.current) {
            geogebraContainerRef.current.style.height = `${nextHeight}px`;
            geogebraContainerRef.current.style.minHeight = `${nextHeight}px`;

            geogebraContainerRef.current
                .querySelectorAll("iframe, embed")
                .forEach(element => {
                    element.style.width = "100%";
                    element.style.height = `${nextHeight}px`;
                });
        }

        localStorage.setItem(
            calculatorSizeStorageKey,
            JSON.stringify(savedSize.current)
        );
    };

    const centerToolPanel = (tool, size) => {
        const width = Math.min(size.width, window.innerWidth - 32);
        const height = Math.min(size.height, window.innerHeight - 32);

        savedPosition.current = { x: 0, y: 0 };
        setPanelPosition(savedPosition.current);
        setPanelAnchor({
            top: Math.max(16, (window.innerHeight - height) / 2),
            right: Math.max(16, (window.innerWidth - width) / 2)
        });
        localStorage.removeItem(calculatorPositionStorageKey);
        setActiveTool(tool);
        setOpen(true);
    };

    const resetGeoGebraWindow = () => {
        savedSize.current = defaultGeoGebraSize;
        setGeogebraSize(defaultGeoGebraSize);
        geogebraAppletRef.current?.setSize?.(
            defaultGeoGebraSize.width,
            defaultGeoGebraSize.height
        );

        if (geogebraContainerRef.current) {
            geogebraContainerRef.current.style.height = `${defaultGeoGebraSize.height}px`;
            geogebraContainerRef.current.style.minHeight = `${defaultGeoGebraSize.height}px`;
        }

        localStorage.removeItem(calculatorSizeStorageKey);
        centerToolPanel("geogebra", defaultGeoGebraSize);
    };

    const closeModal = async () => {
        await saveGeoGebra(true);
        savedPosition.current = {
            x: 0,
            y: 0
        };
        localStorage.removeItem(calculatorPositionStorageKey);
        setOpen(false);
    };

    const hasAnyTool = showCalculator || showGeoGebra;

    if (!hasAnyTool) {
        return null;
    }

    const toggleTool = (tool) => {
        if (tool === activeTool && open) {
            setOpen(false);
            return;
        }

        setActiveTool(tool);
        updatePanelAnchor();
        setOpen(true);
    };

    const renderToolToggleRow = () => (
        <div className="flex flex-wrap items-center gap-2">
            {showCalculator && (
                <Button
                    type="button"
                    variant="outline"
                    className={open && activeTool === "calculator"
                        ? "border-green-600 bg-green-600 text-white hover:bg-green-700 hover:text-white"
                        : "bg-white"}
                    onClick={event => {
                        if (event.detail !== 2) {
                            toggleTool("calculator");
                        }
                    }}
                    onDoubleClick={() => centerToolPanel("calculator", {
                        width: 288,
                        height: 300
                    })}
                >
                    <CalculatorIcon className="h-4 w-4" />
                    Miniräknare
                </Button>
            )}

            {showGeoGebra && (
                <Button
                    type="button"
                    variant="outline"
                    className={open && activeTool === "geogebra"
                        ? "border-green-600 bg-green-600 text-white hover:bg-green-700 hover:text-white"
                        : "bg-white"}
                    onClick={event => {
                        if (event.detail !== 2) {
                            toggleTool("geogebra");
                        }
                    }}
                    onDoubleClick={resetGeoGebraWindow}
                >
                    <CalculatorIcon className="h-4 w-4" />
                    GeoGebra CAS
                </Button>
            )}
        </div>
    );

    const toolPanel = open && panelAnchor && createPortal(
        <Draggable
            handle=".calculator-drag-handle"
            cancel=".calculator-controls"
            nodeRef={calculatorRef}
            position={panelPosition}
            onStop={(_event, data) => {
                savedPosition.current = {
                    x: data.x,
                    y: data.y
                };
                setPanelPosition(savedPosition.current);

                localStorage.setItem(
                    calculatorPositionStorageKey,
                    JSON.stringify(savedPosition.current)
                );
            }}
        >
            <section
                ref={calculatorRef}
                aria-label={activeTool === "geogebra" ? "GeoGebra CAS" : "Miniräknare"}
                className="fixed z-[9999] rounded-lg border bg-background shadow-lg"
                style={{
                    top: `${panelAnchor.top}px`,
                    right: `${panelAnchor.right}px`,
                    width: activeTool === "geogebra" ? `${savedSize.current.width}px` : "18rem",
                    maxWidth: "calc(100vw - 2rem)"
                }}
            >
                {activeTool === "calculator" && (
                    <div className="calculator-drag-handle m-3 cursor-move select-none rounded-md border bg-background px-3 py-2 text-right">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-medium text-muted-foreground">
                                Miniräknare
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={closeModal}
                                aria-label="Stäng verktyg"
                            >
                                ×
                            </Button>
                        </div>
                        <>
                            <div className="min-h-5 break-all text-sm text-muted-foreground">
                                {expression || "0"}
                            </div>
                            <div className="min-h-7 break-all text-xl font-semibold">
                                {result}
                            </div>
                        </>
                    </div>
                )}

                {activeTool === "geogebra" ? (
                    <div className="relative overflow-hidden rounded-md">
                        <div className="calculator-drag-handle absolute right-2 top-2 z-10 flex cursor-move items-center rounded-md bg-background/90 p-1 shadow">
                            <Grip className="mx-1 h-4 w-4 text-muted-foreground" aria-label="Flytta GeoGebra" />
                            <div className="calculator-controls flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => resizeGeoGebra(-80, -60)}
                                    aria-label="Minska GeoGebra-fönstret"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => resizeGeoGebra(80, 60)}
                                    aria-label="Öka GeoGebra-fönstret"
                                >
                                    +
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={closeModal}
                                    aria-label="Stäng verktyg"
                                >
                                    ×
                                </Button>
                            </div>
                        </div>
                        <div
                            id={geogebraContainerId}
                            ref={geogebraContainerRef}
                            aria-label="GeoGebra CAS"
                            style={{
                                width: "100%",
                                height: `${geogebraSize.height}px`,
                                minHeight: `${geogebraSize.height}px`
                            }}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2">
                        {calculatorKeys.flat().map((key, index) => (
                            key ? (
                                <Button
                                    key={key}
                                    type="button"
                                    variant="outline"
                                    className="h-9"
                                    onClick={() => append(key)}
                                >
                                    {key}
                                </Button>
                            ) : (
                                <div key={`empty-${index}`} />
                            )
                        ))}
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-9"
                            onClick={clear}
                        >
                            C
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-9"
                            onClick={removeLast}
                            aria-label="Ta bort sista tecknet"
                        >
                            <Delete />
                        </Button>
                        <Button
                            type="button"
                            className="col-span-2 h-9"
                            onClick={calculate}
                        >
                            =
                        </Button>
                    </div>
                )}
            </section>
        </Draggable>,
        document.body
    );

    return (
        <div ref={anchorRef} className="relative flex flex-col items-end gap-2">
            {renderToolToggleRow()}
            {toolPanel}
        </div>
    );
}
