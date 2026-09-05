import React, { useState, useEffect } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Info, ShoppingCart } from "lucide-react";

export default function TradeDialog({
    open,
    onOpenChange,
    competitionId,
    ticker = "AAPL",
    currentPrice = 150.0,
    onTradeCompleted,
}) {
    const [dialogTab, setDialogTab] = useState("trade"); // 'info' eller 'trade'
    const [tradeType, setTradeType] = useState("BUY");
    const [shares, setShares] = useState("");
    const [reasoning, setReasoning] = useState("");
    const [loading, setLoading] = useState(false);
    const [participantInfo, setParticipantInfo] = useState(null);

    const numShares = parseFloat(shares) || 0;
    const totalAmount = numShares * Number(currentPrice);

    useEffect(() => {
        if (open && competitionId) {
            fetchCompetitionInfo();
        }
    }, [open, competitionId]);

    async function fetchCompetitionInfo() {
        try {
            const response = await fetch(`${API_URL}/api/competitions/${competitionId}`, {
                headers: authHeaders(),
            });
            if (!response.ok) {
                throw new Error("Kunde inte hämta tävlingsdata.");
            }

            const data = await response.json();
            
            if (data.participants && Array.isArray(data.participants)) {
                const me = data.participants.find((p) => p.is_participant) || data.participants[0];
                setParticipantInfo(me);
            }
        } catch (err) {
            console.error("Fel vid hämtning av deltagarinfo:", err);
        }
    }

    async function handleExecuteTrade(e) {
        e.preventDefault();

        if (!competitionId) {
            toast.error("Saknar tävlings-ID. Kan inte genomföra order.");
            return;
        }

        if (!shares || numShares <= 0) {
            toast.error("Vänligen ange ett giltigt antal aktier.");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ticker: ticker,
                type: tradeType,
                shares: Number(numShares),
                price: Number(currentPrice),
                reasoning: reasoning,
            };

            const response = await fetch(
                `${API_URL}/api/competitions/${competitionId}/trade`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders(),
                    },
                    body: JSON.stringify(payload),
                }
            );

            const responseData = await response.text();

            if (!response.ok) {
                let errorMsg = "Transaktionen misslyckades.";
                try {
                    const parsed = JSON.parse(responseData);
                    errorMsg = parsed.error || parsed.message || errorMsg;
                } catch {
                    if (responseData) errorMsg = responseData;
                }
                throw new Error(errorMsg);
            }

            toast.success(
                tradeType === "BUY"
                    ? `Köpte ${numShares} st ${ticker}!`
                    : `Sålde ${numShares} st ${ticker}!`
            );

            setShares("");
            setReasoning("");
            onOpenChange(false);

            if (onTradeCompleted) {
                onTradeCompleted();
            }
        } catch (error) {
            console.error("Handelsfel:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl w-[92vw] p-6 rounded-xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Handla: <span className="font-bold text-primary">{ticker}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Aktuellt pris per enhet:{" "}
                        <span className="font-semibold text-foreground">
                            {(Number(currentPrice) || 0).toLocaleString("sv-SE")} SEK
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {/* Huvudflikar för dialogen */}
                <Tabs value={dialogTab} onValueChange={setDialogTab} className="w-full space-y-4">
                    <TabsList className="grid w-full grid-cols-2 h-10">
                        <TabsTrigger value="trade" className="text-xs font-semibold gap-1.5">
                            <ShoppingCart className="h-4 w-4" /> Lägg Order
                        </TabsTrigger>
                        <TabsTrigger value="info" className="text-xs font-semibold gap-1.5">
                            <Info className="h-4 w-4" /> Om tillgången & Saldo
                        </TabsTrigger>
                    </TabsList>

                    {/* FLIK 1: HANDEL & FORMULÄR */}
                    <TabsContent value="trade" className="space-y-4 pt-1">
                        <form onSubmit={handleExecuteTrade} className="space-y-4">
                            <Tabs defaultValue="BUY" value={tradeType} onValueChange={setTradeType} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-9">
                                    <TabsTrigger value="BUY" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                                        <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> Köp
                                    </TabsTrigger>
                                    <TabsTrigger value="SELL" className="text-xs data-[state=active]:bg-rose-600 data-[state=active]:text-white">
                                        <ArrowDownRight className="mr-1 h-3.5 w-3.5" /> Sälj
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="space-y-1.5">
                                <Label htmlFor="shares" className="text-xs font-semibold">
                                    Antal aktier / fondandelar
                                </Label>
                                <Input
                                    id="shares"
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="0"
                                    value={shares}
                                    onChange={(e) => setShares(e.target.value)}
                                    required
                                    className="text-sm h-10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="reasoning" className="text-xs font-semibold">
                                    Motivering (valfri)
                                </Label>
                                <Textarea
                                    id="reasoning"
                                    placeholder="Skriv en kort analys..."
                                    rows={2}
                                    value={reasoning}
                                    onChange={(e) => setReasoning(e.target.value)}
                                    className="text-xs resize-none"
                                />
                            </div>

                            <div className="rounded-lg border bg-muted/20 p-3 text-xs flex justify-between items-center">
                                <span className="text-muted-foreground font-medium">Totalt ordervärde:</span>
                                <span className="font-bold text-foreground text-sm">
                                    {totalAmount.toLocaleString("sv-SE")} SEK
                                </span>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className={`w-full h-10 font-semibold text-sm ${
                                    tradeType === "BUY"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-rose-600 hover:bg-rose-700 text-white"
                                }`}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : tradeType === "BUY" ? (
                                    "Genomför köp"
                                ) : (
                                    "Genomför försäljning"
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* FLIK 2: INFORMATION & SALDO */}
                    <TabsContent value="info" className="space-y-4 pt-1">
                        <div className="bg-muted/20 border rounded-lg p-4 space-y-3">
                            <h3 className="font-bold text-sm text-foreground">Om {ticker}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Du lägger ordrar baserat på marknadens aktuella pris. Kontrollera alltid dina saldon och att du följer tävlingens eventuella maxgränser per innehav.
                            </p>
                        </div>

                        {participantInfo && participantInfo.cash_balance !== undefined && (
                            <div className="flex items-center justify-between rounded-lg border bg-background p-4 text-xs shadow-sm">
                                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Wallet className="h-4 w-4 text-primary" /> Tillgängligt saldo i tävlingen:
                                </span>
                                <span className="font-bold text-foreground text-sm">
                                    {Number(participantInfo.cash_balance).toLocaleString("sv-SE")} SEK
                                </span>
                            </div>
                        )}

                        <div className="text-center pt-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setDialogTab("trade")}
                                className="text-xs"
                            >
                                Gå vidare till handel &rarr;
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}