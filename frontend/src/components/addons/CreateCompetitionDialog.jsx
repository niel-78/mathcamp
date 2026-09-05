import { useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function CreateCompetitionDialog({
    open,
    onOpenChange,
    groupId,
    onCreated
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startingBudget, setStartingBudget] = useState(100000);
    const [maxStockWeight, setMaxStockWeight] = useState(20);
    const [tradingFee, setTradingFee] = useState(0);

    // Schemaläggning
    const [scheduleType, setScheduleType] = useState("single"); // "manual" | "single" | "recurring"
    const [recurInterval, setRecurInterval] = useState("daily"); // "daily" | "weekly" | "monthly"
    const [recurStartTime, setRecurStartTime] = useState("09:00");
    const [recurEndTime, setRecurEndTime] = useState("15:00");

    const [requireReasoning, setRequireReasoning] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/competitions`, {
                method: "POST",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    groupId,
                    title,
                    description,
                    scheduleType,
                    startDate: scheduleType === "single" ? startDate : null,
                    endDate: scheduleType === "single" ? endDate : null,
                    recurInterval: scheduleType === "recurring" ? recurInterval : null,
                    recurStartTime: scheduleType === "recurring" ? recurStartTime : null,
                    recurEndTime: scheduleType === "recurring" ? recurEndTime : null,
                    startingBudget: Number(startingBudget),
                    maxStockWeight: Number(maxStockWeight) / 100,
                    tradingFee: Number(tradingFee), // <-- LÄGG TILL DENNA
                    isOpen: scheduleType === "manual" ? false : true,
                    requireReasoning
                })
            });

            if (!response.ok) {
                const err = await response.text();
                alert(`Fel vid skapande: ${err}`);
                return;
            }

            // Återställ formulär
            setTitle("");
            setDescription("");
            setStartDate("");
            setEndDate("");
            setScheduleType("single");
            setRequireReasoning(false);

            onCreated();
            onOpenChange(false);
        } catch (error) {
            console.error("Fel vid skapande av tävling:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Skapa ny investeringstävling</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tävlingens namn</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded p-2 text-sm"
                            placeholder="t.ex. Aktiekampen 2026"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Beskrivning / Regler</label>
                        <textarea
                            className="w-full border rounded p-2 text-sm"
                            rows={2}
                            placeholder="Korta instruktioner till eleverna..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Schemaläggning av handel */}
                    <div className="border p-3 rounded-md bg-gray-50 space-y-3">
                        <label className="block text-sm font-semibold">När får eleverna handla?</label>
                        <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                            <button
                                type="button"
                                className={`p-2 border rounded text-center ${scheduleType === "single" ? "bg-black text-white" : "bg-white text-gray-700"}`}
                                onClick={() => setScheduleType("single")}
                            >
                                Engångsperiod
                            </button>
                            <button
                                type="button"
                                className={`p-2 border rounded text-center ${scheduleType === "recurring" ? "bg-black text-white" : "bg-white text-gray-700"}`}
                                onClick={() => setScheduleType("recurring")}
                            >
                                Återkommande
                            </button>
                            <button
                                type="button"
                                className={`p-2 border rounded text-center ${scheduleType === "manual" ? "bg-black text-white" : "bg-white text-gray-700"}`}
                                onClick={() => setScheduleType("manual")}
                            >
                                Manuell knapp
                            </button>
                        </div>

                        {/* Alt 1: Engångsperiod */}
                        {scheduleType === "single" && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Startdatum & tid</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full border rounded p-2 text-sm bg-white"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Slutdatum & tid</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full border rounded p-2 text-sm bg-white"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Alt 2: Återkommande */}
                        {scheduleType === "recurring" && (
                            <div className="space-y-3 pt-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Intervall</label>
                                    <select
                                        className="w-full border rounded p-2 text-sm bg-white"
                                        value={recurInterval}
                                        onChange={(e) => setRecurInterval(e.target.value)}
                                    >
                                        <option value="daily">Varje dag</option>
                                        <option value="weekly">Varje vecka (Måndag - Fredag)</option>
                                        <option value="monthly">Varje månad (1:a - 15:e)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Öppnar klockan</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full border rounded p-2 text-sm bg-white"
                                            value={recurStartTime}
                                            onChange={(e) => setRecurStartTime(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Stänger klockan</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full border rounded p-2 text-sm bg-white"
                                            value={recurEndTime}
                                            onChange={(e) => setRecurEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {scheduleType === "manual" && (
                            <p className="text-xs text-gray-500 italic pt-1">
                                Handeln kommer att vara stängd tills du manuellt trycker på "Öppna handeln".
                            </p>
                        )}
                    </div>

                    {/* Krav på motivering */}
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="requireReasoning"
                            checked={requireReasoning}
                            onChange={(e) => setRequireReasoning(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="requireReasoning" className="text-sm font-medium cursor-pointer">
                            Kräv motivering från eleverna vid varje transaktion
                        </label>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium mb-1">Startkapital (kr)</label>
                            <input
                                type="number"
                                required
                                min="1000"
                                className="w-full border rounded p-2 text-sm"
                                value={startingBudget}
                                onChange={(e) => setStartingBudget(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Max % per aktie</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="100"
                                className="w-full border rounded p-2 text-sm"
                                value={maxStockWeight}
                                onChange={(e) => setMaxStockWeight(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Courtage (kr/köp)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="1"
                                className="w-full border rounded p-2 text-sm"
                                placeholder="t.ex. 19"
                                value={tradingFee}
                                onChange={(e) => setTradingFee(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Avbryt
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Skapar..." : "Skapa tävling"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}