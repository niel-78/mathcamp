import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

export default function CreateBlockFromExcelDialog({
    open,
    onOpenChange,
    abilityId,
    sectionId,
    centralContentId,
    onCreated
}) {

    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [abilitySeries, setAbilitySeries] = useState([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState("");
    const [selectedAbilityId, setSelectedAbilityId] = useState(
        abilityId ?? ""
    );
    const [newAbilityName, setNewAbilityName] = useState("");

    const downloadTemplate = async () => {

        const response =
            await fetch(
                `${API_URL}/api/blocks/import-template`,
                {
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        const blob =
            await response.blob();

        const url =
            URL.createObjectURL(blob);

        const a =
            document.createElement("a");

        a.href = url;
        a.download =
            "block-mall.xlsx";

        a.click();

        URL.revokeObjectURL(url);

    };

    useEffect(() => {
        if (!open) {
            return;
        }

        const loadAbilitySeries = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/ability-series`,
                    {
                        headers: authHeaders()
                    }
                );

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                const nextSeries = data || [];
                setAbilitySeries(nextSeries);

                setSelectedSeriesId((current) => {
                    if (current) {
                        return current;
                    }

                    return nextSeries[0] ? String(nextSeries[0].id) : "";
                });
            } catch (error) {
                console.error(error);
            }
        };

        loadAbilitySeries();
    }, [open]);

    const selectedSeries = abilitySeries.find(
        (series) => String(series.id) === String(selectedSeriesId)
    );

    const availableAbilities = selectedSeries?.abilities || [];

    useEffect(() => {
        if (!selectedSeriesId) {
            setSelectedAbilityId("");
            return;
        }

        if (!availableAbilities.length) {
            setSelectedAbilityId("");
            return;
        }

        if (!selectedAbilityId && !abilityId) {
            setSelectedAbilityId(String(availableAbilities[0].id));
        }
    }, [availableAbilities, selectedSeriesId, selectedAbilityId, abilityId]);

    const createAbility = async (seriesIdOverride) => {
        const name = newAbilityName.trim();
        const targetSeriesId = seriesIdOverride || selectedSeriesId || abilitySeries[0]?.id;

        if (!targetSeriesId || !name) {
            return null;
        }

        const response = await fetch(
            `${API_URL}/api/abilities`,
            {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    seriesId: Number(targetSeriesId)
                })
            }
        );

        if (!response.ok) {
            throw new Error("Kunde inte skapa ny förmåga.");
        }

        const created = await response.json();
        setNewAbilityName("");
        setSelectedSeriesId(String(targetSeriesId));
        setSelectedAbilityId(String(created.id));

        const refreshed = await fetch(
            `${API_URL}/api/ability-series`,
            {
                headers: authHeaders()
            }
        );

        if (refreshed.ok) {
            const data = await refreshed.json();
            setAbilitySeries(data || []);
        }

        return created.id;
    };

    const createBlock = async () => {
        try {

            setLoading(true);

            const defaultSeriesId = selectedSeriesId || abilitySeries[0]?.id;
            const resolvedAbilityId =
                abilityId ||
                selectedAbilityId ||
                (newAbilityName.trim() ? await createAbility(defaultSeriesId) : null);

            if (!resolvedAbilityId) {
                return;
            }

            const formData = new FormData();

            formData.append("file", file);
            formData.append("abilityId", String(resolvedAbilityId));

            if (sectionId) {
                formData.append(
                    "sectionId",
                    sectionId
                );
            }

            if (centralContentId) {
                formData.append(
                    "centralContentId",
                    centralContentId
                );
            }

            const response = await fetch(
                `${API_URL}/api/blocks/import`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: formData
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Kunde inte skapa blocket.");
            }

            const data = await response.json();
            setResult({
                blockId: data.blockId,
                questionCount: data.questionCount
            });
            onCreated?.(data.block);
            onOpenChange(false);

        } catch (error) {
            console.error(error);
            setResult({ error: error.message || "Kunde inte skapa blocket." });
        } finally {

            setLoading(false);

        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent>

                <DialogHeader>
                    <DialogTitle>
                        Skapa block från Excel
                    </DialogTitle>
                </DialogHeader>

                <Button
                    variant="outline"
                    onClick={downloadTemplate}
                >
                    Ladda ner Excel-mall
                </Button>

                {!abilityId && (
                    <div className="space-y-3">
                        <select
                            value={selectedSeriesId}
                            onChange={(e) => {
                                setSelectedSeriesId(e.target.value);
                                setSelectedAbilityId("");
                            }}
                            className="border rounded px-3 py-2 w-full"
                        >
                            <option value="">Välj serie</option>

                            {abilitySeries.map((series) => (
                                <option key={series.id} value={series.id}>
                                    {series.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedAbilityId}
                            onChange={(e) =>
                                setSelectedAbilityId(e.target.value)
                            }
                            className="border rounded px-3 py-2 w-full"
                            disabled={!selectedSeriesId}
                        >
                            <option value="">Välj förmåga</option>

                            {(availableAbilities || []).map((ability) => (
                                <option key={ability.id} value={ability.id}>
                                    {ability.name}
                                </option>
                            ))}
                        </select>

                        {selectedSeriesId && (
                            <div className="flex gap-2">
                                <Input
                                    value={newAbilityName}
                                    onChange={(e) => setNewAbilityName(e.target.value)}
                                    placeholder="Skapa ny förmåga"
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={createAbility}
                                    disabled={!newAbilityName.trim()}
                                >
                                    Skapa
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) =>
                        setFile(
                            e.target.files?.[0]
                        )
                    }
                />

                <Button
                    onClick={createBlock}
                    disabled={!file || loading || (!abilityId && !selectedAbilityId && !newAbilityName.trim())}
                >
                    {loading
                        ? "Skapar block..."
                        : "Skapa block"}
                </Button>

                {result && (
                    <div
                        className={
                            result.error
                                ? "rounded-md border border-red-500 bg-red-500/10 p-3"
                                : "rounded-md border border-green-500 bg-green-500/10 p-3"
                        }
                    >
                        {result.error ? (
                            <span>{result.error}</span>
                        ) : (
                            <>
                                Block #{result.blockId} skapades
                                <br />
                                {result.questionCount} frågor importerades
                            </>
                        )}
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );

}