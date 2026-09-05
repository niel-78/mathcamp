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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from "lucide-react";
import TradingViewWidget from "./TradingViewWidget";

export default function TradeDialog({
  open,
  onOpenChange,
  competitionId,
  ticker = "AAPL",
  currentPrice = 150.0,
  onTradeCompleted,
}) {
  const [tradeType, setTradeType] = useState("BUY");
  const [shares, setShares] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [participantInfo, setParticipantInfo] = useState(null);

  const numShares = parseFloat(shares) || 0;
  const totalAmount = numShares * currentPrice;

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
      if (!response.ok) throw new Error("Kunde inte hämta tävlingsdata");

      const data = await response.json();
      
      // Om backend skickar deltagarlistan, matcha mot inloggad användare
      if (data.participants && Array.isArray(data.participants)) {
        // Försök hitta deltagaren via is_participant eller första träff
        const me = data.participants.find((p) => p.is_participant) || data.participants[0];
        setParticipantInfo(me);
      }
    } catch (err) {
      console.error("Fel vid hämtning av deltagarinfo:", err);
    }
  }

  async function handleExecuteTrade(e) {
    e.preventDefault();

    if (!shares || numShares <= 0) {
      toast.error("Vänligen ange ett giltigt antal aktier.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/competitions/${competitionId}/trade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            ticker,
            type: tradeType,
            shares: numShares,
            price: currentPrice,
            reasoning,
          }),
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(data || "Transaktionen misslyckades.");
      }

      toast.success(
        tradeType === "BUY"
          ? `Köpte ${numShares} st ${ticker}!`
          : `Sålde ${numShares} st ${ticker}!`
      );

      setShares("");
      setReasoning("");
      onOpenChange(false);

      if (onTradeCompleted) onTradeCompleted();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] rounded-xl p-6 overflow-hidden">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
            Handla: <span className="font-bold text-primary">{ticker}</span>
          </DialogTitle>
          <DialogDescription>
            Aktuellt kurspris: <span className="font-semibold text-foreground">{(currentPrice || 0).toLocaleString("sv-SE")} SEK</span>
          </DialogDescription>
        </DialogHeader>

        {/* Grid-layout: Graf (vänster) & Formulär (höger) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* TradingView Container - Säkerställd höjd */}
          <div className="lg:col-span-2 w-full h-[420px] min-h-[420px] rounded-lg overflow-hidden border">
            <TradingViewWidget symbol={ticker} theme="light" />
          </div>

          {/* Handelsformulär */}
          <form onSubmit={handleExecuteTrade} className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <Tabs defaultValue="BUY" value={tradeType} onValueChange={setTradeType} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="BUY" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <ArrowUpRight className="mr-1 h-4 w-4" /> Köp
                  </TabsTrigger>
                  <TabsTrigger value="SELL" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white">
                    <ArrowDownRight className="mr-1 h-4 w-4" /> Sälj
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {participantInfo && participantInfo.cash_balance !== undefined && (
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" /> Tillgängligt saldo:
                  </span>
                  <span className="font-semibold text-foreground">
                    {Number(participantInfo.cash_balance).toLocaleString("sv-SE")} SEK
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="shares" className="text-xs font-semibold">Antal aktier</Label>
                <Input
                  id="shares"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reasoning" className="text-xs font-semibold">Motivering</Label>
                <Textarea
                  id="reasoning"
                  placeholder="Skriv en kort analys eller motivering..."
                  rows={3}
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                />
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Orderbelopp:</span>
                  <span className="font-semibold text-foreground">{totalAmount.toLocaleString("sv-SE")} SEK</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 ${
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

        </div>
      </DialogContent>
    </Dialog>
  );
}