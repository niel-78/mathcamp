import { useEffect, useId, useRef, useState } from "react";
import { evaluate } from "mathjs";
import Draggable from "react-draggable";
import { Calculator as CalculatorIcon, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

    return {
        width: 720,
        height: 520
    };
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
    const [geogebraReady, setGeogebraReady] = useState(false);
    const [geogebraSaving, setGeogebraSaving] = useState(false);
    const [geogebraName, setGeogebraName] = useState(
        attemptId && questionId
            ? "Provkonstruktion"
            : "Min GeoGebra-konstruktion"
    );
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
    const canPersistGeoGebra = Boolean(attemptId && questionId);
    const geogebraStorageUrl = attemptId && questionId
        ? `${API_URL}/api/assessment-attempts/${attemptId}/geogebra/${questionId}`
        : `${API_URL}/api/geogebra-constructions`;

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
        if (!open || activeTool !== "geogebra" || !geogebraReady || !autoSaveEnabled) {
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
    }, [activeTool, autoSaveEnabled, geogebraName, geogebraReady, open]);

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

    const saveGeoGebra = async (silent = false) => {
        if (!geogebraAppletRef.current) {
            return;
        }

        setGeogebraSaving(true);

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
        } finally {
            setGeogebraSaving(false);
        }
    };

    const closeModal = () => {
        savedPosition.current = {
            x: 0,
            y: 0
        };
        localStorage.removeItem(calculatorPositionStorageKey);
        setOpen(false);
    };

    const loadGeoGebra = async () => {
        if (!geogebraAppletRef.current) {
            return;
        }

        try {
            const response = await fetch(
                geogebraStorageUrl,
                { headers: authHeaders() }
            );

            if (await handleUnauthorized(response)) {
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Kunde inte ladda konstruktionen.");
            }

            if (!data.construction?.construction_xml) {
                toast.info("Det finns ingen sparad konstruktion för frågan.");
                return;
            }

            setGeogebraName(
                data.construction.name || geogebraName
            );
            geogebraAppletRef.current.setXML(
                data.construction.construction_xml
            );
            lastSavedGeoGebraXml.current = data.construction.construction_xml;
            toast.success("GeoGebra-konstruktionen laddades.");
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Kunde inte ladda konstruktionen.");
        }
    };

    const deleteGeoGebra = async () => {
        if (!geogebraAppletRef.current) {
            return;
        }

        if (!window.confirm("Vill du radera den sparade GeoGebra-konstruktionen?")) {
            return;
        }

        try {
            const response = await fetch(
                geogebraStorageUrl,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

            if (await handleUnauthorized(response)) {
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Kunde inte radera konstruktionen.");
            }

            geogebraAppletRef.current.reset?.();
            toast.success("GeoGebra-konstruktionen raderades.");
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Kunde inte radera konstruktionen.");
        }
    };

    const resizeGeoGebra = (direction) => {
        const nextWidth = Math.min(1100, Math.max(520, savedSize.current.width + (direction === "larger" ? 80 : -80)));
        const nextHeight = Math.min(900, Math.max(400, savedSize.current.height + (direction === "larger" ? 60 : -60)));

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
        setOpen(true);
    };

    const renderToolToggleRow = () => (
        <div className="flex flex-wrap items-center gap-2">
            {showCalculator && (
                <Button
                    type="button"
                    variant={activeTool === "calculator" ? "default" : "outline"}
                    onClick={() => toggleTool("calculator")}
                >
                    <CalculatorIcon className="h-4 w-4" />
                    Miniräknare
                </Button>
            )}

            {showGeoGebra && (
                <Button
                    type="button"
                    variant={activeTool === "geogebra" ? "default" : "outline"}
                    onClick={() => toggleTool("geogebra")}
                >
                    <CalculatorIcon className="h-4 w-4" />
                    GeoGebra CAS
                </Button>
            )}
        </div>
    );

    return (
        <div className="relative flex flex-col items-end gap-2">
            {renderToolToggleRow()}

            {open && (
                <Draggable
                    handle=".calculator-drag-handle"
                    cancel=".calculator-controls"
                    nodeRef={calculatorRef}
                    defaultPosition={savedPosition.current}
                    onStop={(_event, data) => {
                        savedPosition.current = {
                            x: data.x,
                            y: data.y
                        };

                        localStorage.setItem(
                            calculatorPositionStorageKey,
                            JSON.stringify(savedPosition.current)
                        );
                    }}
                >
                    <section
                        ref={calculatorRef}
                        aria-label={activeTool === "geogebra" ? "GeoGebra CAS" : "Miniräknare"}
                        className="absolute right-0 top-full z-[9999] mt-2 rounded-lg border bg-background shadow-lg"
                        style={{
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
                                    <div className="calculator-controls flex items-center gap-2">
                                        <Input
                                            value={geogebraName}
                                            onChange={event => setGeogebraName(event.target.value)}
                                            className="h-8 w-44 bg-background text-xs"
                                            placeholder="Namn på konstruktion"
                                            aria-label="Namn på konstruktion"
                                        />
                                        <label className="flex items-center gap-1 whitespace-nowrap text-xs">
                                            <input
                                                type="checkbox"
                                                checked={autoSaveEnabled}
                                                onChange={event => setAutoSaveEnabled(event.target.checked)}
                                            />
                                            Autospara
                                        </label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => resizeGeoGebra("smaller")}
                                            aria-label="Minska GeoGebra-fönstret"
                                        >
                                            -
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => resizeGeoGebra("larger")}
                                            aria-label="Öka GeoGebra-fönstret"
                                        >
                                            +
                                        </Button>
                                        {geogebraReady && canPersistGeoGebra && (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="default"
                                                    size="sm"
                                                    disabled={!geogebraReady || geogebraSaving}
                                                    onClick={saveGeoGebra}
                                                >
                                                    {geogebraSaving ? "Sparar..." : "Spara"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!geogebraReady || geogebraSaving}
                                                    onClick={loadGeoGebra}
                                                >
                                                    Öppna
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!geogebraReady || geogebraSaving}
                                                    onClick={deleteGeoGebra}
                                                >
                                                    Radera
                                                </Button>
                                            </>
                                        )}
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
                </Draggable>
            )}
        </div>
    );
}
