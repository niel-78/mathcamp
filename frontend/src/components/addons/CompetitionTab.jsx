import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import TradeDialog from "@/components/addons/TradeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MARKET_ASSETS } from "@/data/marketData";
import { 
    Search, 
    TrendingUp, 
    TrendingDown, 
    ArrowUpRight, 
    ArrowDownRight,
    PieChart,
    Building2,
    Wallet,
    Briefcase,
    Trophy,
    Users
} from "lucide-react";

export default function CompetitionTab({ competitionId, groupId, title }) {
    const [activeId, setActiveId] = useState(competitionId);
    const [groupDataList, setGroupDataList] = useState([]);
    const [competition, setCompetition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isParticipant, setIsParticipant] = useState(false);
    const [joining, setJoining] = useState(false);
    
    // Tillstånd för flikar: 'overview', 'portfolio', 'trade'
    const [subTab, setSubTab] = useState("overview");
    const [tradeOpen, setTradeOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState({ ticker: "AAPL", price: 178.50 });
    
    // Filtrering i marknadslistan
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");

    // 1. Om inget competitionId skickas med, hämta elevens grupper och tävlingar
    useEffect(() => {
        if (competitionId) {
            setActiveId(competitionId);
            return;
        }

        const query = groupId
            ? `?groupId=${groupId}`
            : "";

        fetch(`${API_URL}/api/competitions/student/my-competitions${query}`, {
            headers: authHeaders()
        })
        .then(res => res.json())
        .then(data => {
            setGroupDataList(data);
            setLoading(false);
        })
        .catch(err => {
            console.error("Kunde inte hämta grupper/tävlingar:", err);
            setLoading(false);
        });
    }, [competitionId, groupId]);

    // 2. Hämta detaljer för den aktiva tävlingen när activeId ändras
    useEffect(() => {
        if (!activeId) return;
        loadCompetitionDetails(activeId);
    }, [activeId]);

    const loadCompetitionDetails = async (idToFetch) => {
        const targetId = idToFetch || activeId;
        if (!targetId) return;

        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/competitions/${targetId}`, {
                headers: authHeaders(),
            });

            if (res.ok) {
                const data = await res.json();
                setCompetition(data);
                setIsParticipant(Boolean(data.is_participant));
            }
        } catch (err) {
            console.error("Fel vid hämtning av tävling:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinCompetition = async () => {
        const targetId = activeId || competitionId;
        if (!targetId) return;

        try {
            setJoining(true);
            const res = await fetch(`${API_URL}/api/competitions/${targetId}/join`, {
                method: "POST",
                headers: authHeaders(),
            });

            if (res.ok) {
                setIsParticipant(true);
                await loadCompetitionDetails(targetId);
            } else {
                const errorText = await res.text();
                alert(`Kunde inte gå med: ${errorText}`);
            }
        } catch (err) {
            console.error("Fel vid anslutning:", err);
        } finally {
            setJoining(false);
        }
    };

    const checkIsOpen = (comp) => {
        if (!comp) return false;
        if (comp.schedule_type === "scheduled") {
            const now = new Date();
            return new Date(comp.start_date) <= now && new Date(comp.end_date) >= now;
        }
        return Boolean(comp.is_open);
    };

    const handleOpenTrade = (asset) => {
        setSelectedAsset(asset);
        setTradeOpen(true);
    };

    // Om vi laddar
    if (loading) {
        return (
            <BaseTabLayout title={title || "Investeringar & Tävling"}>
                <div className="p-8 text-center text-gray-500">Laddar tävlingar...</div>
            </BaseTabLayout>
        );
    }

    // Om ingen tävling är vald och vi behöver visa en väljare baserat på elevens grupper
    if (!activeId && !competition) {
        return (
            <BaseTabLayout title={title || "Investeringar & Tävling"}>
                <div className="p-6 max-w-3xl mx-auto space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold">Välj investeringstävling</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Här ser du de tävlingar som finns tillgängliga i dina grupper. Välj en för att delta eller handla.
                        </p>
                    </div>

                    {groupDataList.length > 0 ? (
                        <div className="space-y-6">
                            {groupDataList.map((groupItem) => (
                                <div key={groupItem.group_id} className="border rounded-xl bg-white p-5 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 font-semibold text-lg border-b pb-2 text-primary">
                                        <Users className="h-5 w-5" /> {groupItem.group_name}
                                    </div>

                                    {groupItem.competitions.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {groupItem.competitions.map((comp) => (
                                                <div 
                                                    key={comp.id}
                                                    onClick={() => setActiveId(comp.id)}
                                                    className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition flex flex-col justify-between space-y-3"
                                                >
                                                    <div>
                                                        <div className="font-bold text-base flex items-center gap-2">
                                                            <Trophy className="h-4 w-4 text-amber-500" /> {comp.title}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                            {comp.description || "Ingen beskrivning angiven."}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-medium pt-2 border-t text-gray-600">
                                                        <span>Startkapital: {Number(comp.starting_budget).toLocaleString("sv-SE")} kr</span>
                                                        <span className="text-primary font-bold">Öppna tävling →</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic py-2">Inga aktiva tävlingar i denna grupp ännu.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-xl bg-white p-6 shadow-sm space-y-3">
                            <Trophy className="h-12 w-12 text-gray-300 mx-auto" />
                            <h3 className="font-bold text-lg">Inga tävlingar hittades</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                Du är inte med i någon grupp med aktiva investeringstävlingar just nu. Prata med din lärare om du saknar en tävling.
                            </p>
                        </div>
                    )}
                </div>
            </BaseTabLayout>
        );
    }

    // Om tävling är vald men data inte laddats klart
    if (!competition) {
        return (
            <BaseTabLayout title={title || "Tävling"}>
                <div className="p-6 text-red-500">Kunde inte hämta tävlingsdata.</div>
            </BaseTabLayout>
        );
    }

    const isOpen = checkIsOpen(competition);
    const myParticipant = competition.participants?.find((p) => p.is_participant) || null;
    // Beräkna innehav och koppla mot aktuellt marknadspris från MARKET_ASSETS
    const myHoldings = (myParticipant?.holdings || []).map(h => {
        const marketAsset = MARKET_ASSETS.find(a => a.ticker === h.ticker);
        return {
            ...h,
            // Använd live-pris från marknaden om det finns, annars snittpris
            current_price: marketAsset ? marketAsset.price : h.avg_price
        };
    });

    const filteredAssets = MARKET_ASSETS.filter((asset) => {
        const matchesSearch = 
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.ticker.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || asset.type === filterType;
        return matchesSearch && matchesType;
    });

    // 1. Skapa en funktion som räknar ut en deltagares totala värde (cash + aktier)
    const calculateTotalValue = (participant) => {
        const cash = Number(participant.cash_balance || 0);
        const holdingsValue = (participant.holdings || []).reduce((sum, h) => {
            const marketAsset = MARKET_ASSETS.find(a => a.ticker === h.ticker);
            const currentPrice = marketAsset ? marketAsset.price : (h.avg_price || 0);
            return sum + (h.shares * currentPrice);
        }, 0);
        return cash + holdingsValue;
    };

    // 2. Sortera deltagarna baserat på totalt portföljvärde (högst först)
    const sortedParticipants = [...(competition.participants || [])].sort((a, b) => {
        return calculateTotalValue(b) - calculateTotalValue(a);
    });

    return (
        <>
            <BaseTabLayout
                title={competition.title}
                actions={
                    <div className="flex gap-2 items-center">
                        {groupDataList.length > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setActiveId(null); setCompetition(null); }}
                                className="text-xs text-gray-600"
                            >
                                ← Tillbaka till alla tävlingar
                            </Button>
                        )}
                        {isParticipant ? (
                            <div className="flex bg-gray-200 p-1 rounded-lg">
                                <button
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                                        subTab === "overview" ? "bg-white shadow text-black" : "text-gray-600"
                                    }`}
                                    onClick={() => setSubTab("overview")}
                                >
                                    Översikt
                                </button>
                                <button
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                                        subTab === "portfolio" ? "bg-white shadow text-black" : "text-gray-600"
                                    }`}
                                    onClick={() => setSubTab("portfolio")}
                                >
                                    Min Portfölj
                                </button>
                                <button
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                                        subTab === "trade" ? "bg-white shadow text-black" : "text-gray-600"
                                    }`}
                                    onClick={() => setSubTab("trade")}
                                >
                                    Handla
                                </button>
                            </div>
                        ) : (
                            <Button
                                variant="default"
                                onClick={handleJoinCompetition}
                                disabled={joining}
                            >
                                {joining ? "Ansluter..." : "Gå med i tävlingen"}
                            </Button>
                        )}
                    </div>
                }
            >
                <div className="p-6 space-y-6">
                    {/* FLIK 1: ÖVERSIKT */}
                    {subTab === "overview" && (
                        <>
                            <div className="flex justify-between items-start border-b pb-4">
                                <div>
                                    <h1 className="text-2xl font-bold">{competition.title}</h1>
                                    <p className="text-gray-600 mt-1">
                                        {competition.description || "Ingen beskrivning angiven."}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                                        isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {isOpen ? "Handel Öppen" : "Handel Stängd"}
                                </span>
                            </div>

                            {/* Regelöversikt */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg border">
                                <div>
                                    <span className="block text-xs text-gray-500">Startkapital</span>
                                    <span className="font-semibold text-lg">
                                        {Number(competition.starting_budget).toLocaleString("sv-SE")} kr
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500">Max per aktie</span>
                                    <span className="font-semibold text-lg">
                                        {competition.max_stock_weight * 100}%
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500">Courtage</span>
                                    <span className="font-semibold text-lg">
                                        {Number(competition.trading_fee ?? 0).toLocaleString("sv-SE")} kr
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500">Kräv motivering</span>
                                    <span className="font-semibold text-lg">
                                        {competition.require_reasoning ? "Ja" : "Nej"}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500">Styrning</span>
                                    <span className="font-semibold text-lg capitalize">
                                        {competition.schedule_type === "scheduled" ? "Schemalagd" : "Manuell"}
                                    </span>
                                </div>
                            </div>

                            {/* Topplista & Status */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 border rounded-lg p-5 bg-white space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Topplista</h3>
                                    {competition.participants?.length > 0 ? (
                                        <div className="space-y-2">
                                            {sortedParticipants.length > 0 ? (
                                                <div className="space-y-2">
                                                    {sortedParticipants.map((p, idx) => {
                                                        const totalValue = calculateTotalValue(p);
                                                        return (
                                                            <div
                                                                key={p.id}
                                                                className={`flex justify-between items-center p-3 rounded border ${
                                                                    p.is_teacher ? "bg-amber-50 border-amber-200" : "bg-gray-50"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-bold text-gray-500 w-6">#{idx + 1}</span>
                                                                    <span className="font-medium">
                                                                        {p.first_name} {p.last_name}
                                                                    </span>
                                                                    {Boolean(p.is_teacher) && (
                                                                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-medium">
                                                                            Demo / Lärare
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-primary">
                                                                        {totalValue.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr
                                                                    </div>
                                                                    <div className="text-xs text-gray-400">
                                                                        (Varav {Number(p.cash_balance).toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr är disponibla)
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">Inga deltagare har gått med i tävlingen än.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">Inga deltagare har gått med i tävlingen än.</p>
                                    )}
                                </div>

                                <div className="border rounded-lg p-5 bg-white space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Din Status</h3>
                                    {isParticipant ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-600">
                                                Du är med i tävlingen! Se dina innehav under "Min Portfölj" eller handla nya aktier.
                                            </p>
                                            <Button 
                                                className="w-full" 
                                                onClick={() => setSubTab("portfolio")}
                                            >
                                                Gå till Min Portfölj
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 space-y-3">
                                            <p className="text-sm text-gray-500">Du är inte med i tävlingen ännu.</p>
                                            <Button onClick={handleJoinCompetition} disabled={joining}>
                                                Gå med nu
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* FLIK 2: MIN PORTFÖLJ */}
                    {subTab === "portfolio" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-primary" /> Min Portfölj
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Översikt över dina tillgångar och tillgängliga likvida medel.
                                </p>
                            </div>

                            {/* Saldo-kort */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Likvida medel (Cash)</span>
                                        <div className="text-xl font-bold mt-1">
                                            {myParticipant ? Number(myParticipant.cash_balance).toLocaleString("sv-SE") : 0} SEK
                                        </div>
                                    </div>
                                    <Wallet className="h-8 w-8 text-gray-300" />
                                </div>
                                <div className="border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Aktier & Fonder (Värde)</span>
                                        <div className="text-xl font-bold mt-1">
                                            {myHoldings.reduce((sum, h) => sum + (h.shares * h.current_price || 0), 0).toLocaleString("sv-SE")} SEK
                                        </div>
                                    </div>
                                    <PieChart className="h-8 w-8 text-gray-300" />
                                </div>
                            </div>

                            {/* Innehavstabell */}
                            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                                <div className="p-4 border-b bg-gray-50 font-semibold text-sm">
                                    Dina Innehav
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b text-gray-500 text-xs uppercase font-semibold bg-gray-50/50">
                                        <tr>
                                            <th className="px-4 py-3">Tillgång</th>
                                            <th className="px-4 py-3 text-right">Antal</th>
                                            <th className="px-4 py-3 text-right">Gj.snittpris</th>
                                            <th className="px-4 py-3 text-right">Nuvarande Värde</th>
                                            <th className="px-4 py-3 text-center">Åtgärd</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {myHoldings.length > 0 ? (
                                            myHoldings.map((holding) => (
                                                <tr key={holding.ticker} className="hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold">{holding.name || holding.ticker}</div>
                                                        <div className="text-xs text-gray-500">{holding.ticker}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {holding.shares} st
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {Number(holding.avg_price || 0).toLocaleString("sv-SE")} SEK
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold">
                                                        {(holding.shares * (holding.current_price || 0)).toLocaleString("sv-SE")} SEK
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={!isOpen}
                                                            onClick={() => handleOpenTrade({ ticker: holding.ticker, price: holding.current_price || 100 })}
                                                        >
                                                            Handla / Sälj
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                    Du äger inga aktier eller fonder ännu. Gå till "Handla" för att göra ditt första köp!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* FLIK 3: HANDLA (MARKNADSLISTAN) */}
                    {subTab === "trade" && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold">Marknad & Handel</h2>
                                    <p className="text-sm text-gray-500">
                                        Sök bland tillgängliga aktier och fonder för att lägga dina ordrar.
                                    </p>
                                </div>

                                <div className="flex bg-gray-100 p-1 rounded-lg border">
                                    <button
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                                            filterType === "all" ? "bg-white shadow text-black" : "text-gray-600"
                                        }`}
                                        onClick={() => setFilterType("all")}
                                    >
                                        Alla
                                    </button>
                                    <button
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                                            filterType === "stock" ? "bg-white shadow text-black" : "text-gray-600"
                                        }`}
                                        onClick={() => setFilterType("stock")}
                                    >
                                        Aktier
                                    </button>
                                    <button
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                                            filterType === "fund" ? "bg-white shadow text-black" : "text-gray-600"
                                        }`}
                                        onClick={() => setFilterType("fund")}
                                    >
                                        Fonder
                                    </button>
                                </div>
                            </div>

                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Sök på bolagsnamn eller ticker..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b text-gray-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-4 py-3">Tillgång</th>
                                            <th className="px-4 py-3">Typ</th>
                                            <th className="px-4 py-3 text-right">Senaste Kurs</th>
                                            <th className="px-4 py-3 text-right">Idag</th>
                                            <th className="px-4 py-3 text-center">Åtgärd</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredAssets.length > 0 ? (
                                            filteredAssets.map((asset) => {
                                                const isPositive = asset.change >= 0;
                                                return (
                                                    <tr key={asset.ticker} className="hover:bg-gray-50 transition">
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-gray-900">{asset.name}</div>
                                                            <div className="text-xs text-gray-500">{asset.ticker}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {asset.type === "stock" ? (
                                                                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                                    <Building2 className="h-3 w-3" /> Aktie
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                                                                    <PieChart className="h-3 w-3" /> Fond
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium">
                                                            {asset.price.toLocaleString("sv-SE")} SEK
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`inline-flex items-center font-medium ${
                                                                isPositive ? "text-emerald-600" : "text-rose-600"
                                                            }`}>
                                                                {isPositive ? (
                                                                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                                                                ) : (
                                                                    <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                                                                )}
                                                                {isPositive ? `+${asset.change}%` : `${asset.change}%`}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button
                                                                size="sm"
                                                                disabled={!isOpen}
                                                                onClick={() => handleOpenTrade(asset)}
                                                            >
                                                                Handla
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                    Inga aktier eller fonder matchade din sökning.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </BaseTabLayout>

            <TradeDialog
                open={tradeOpen}
                onOpenChange={setTradeOpen}
                competitionId={activeId || competitionId}
                ticker={selectedAsset.ticker}
                currentPrice={selectedAsset.price}
                onTradeCompleted={() => loadCompetitionDetails(activeId || competitionId)}
            />
        </>
    );
}