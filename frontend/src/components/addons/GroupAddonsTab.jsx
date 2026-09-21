import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { Button } from "@/components/ui/button";
import { authHeaders } from "@/api/authHeaders";
import CreateCompetitionDialog from "@/components/addons/CreateCompetitionDialog";
import { Eye, EyeOff } from "lucide-react";

export default function GroupAddonsTab({
    groupId,
    groupName,
    openTab
}) {
    const [competitions, setCompetitions] = useState([]);
    const [createCompetitionOpen, setCreateCompetitionOpen] = useState(false);

    useEffect(() => {
        loadCompetitions();
    }, [groupId]);

    const loadCompetitions = async () => {
        const response = await fetch(
            `${API_URL}/api/competitions/group/${groupId}`,
            { headers: authHeaders() }
        );

        if (!response.ok) {
            console.error(await response.text());
            return;
        }

        const data = await response.json();
        setCompetitions(data);
    };

    const toggleMarketOpen = async (competitionId, currentIsOpen) => {
        try {
            const response = await fetch(`${API_URL}/api/competitions/${competitionId}/toggle-open`, {
                method: "PATCH",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ isOpen: !currentIsOpen })
            });

            if (response.ok) {
                loadCompetitions();
            }
        } catch (error) {
            console.error("Kunde inte ändra status för handeln:", error);
        }
    };

    const toggleCompetitionVisibility = async (competitionId, currentIsVisible) => {
        try {
            const response = await fetch(`${API_URL}/api/competitions/${competitionId}/toggle-visibility`, {
                method: "PATCH",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ isVisible: !currentIsVisible })
            });

            if (response.ok) {
                loadCompetitions();
            }
        } catch (error) {
            console.error("Kunde inte ändra tävlingens synlighet:", error);
        }
    };

    return (
        <>
            <BaseTabLayout
                title={`${groupName} - Tillval`}
                actions={
                    <Button
                        variant="default"
                        onClick={() => setCreateCompetitionOpen(true)}
                    >
                        Skapa tävling
                    </Button>
                }
            >
                <div className="p-4 space-y-4">
                    <h2 className="text-xl font-bold">Investeringstävlingar</h2>
                    
                    {competitions.length === 0 ? (
                        <p className="text-gray-500">Inga tävlingar har skapats för den här gruppen än.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {competitions.map((comp) => {
                                // Kolla om handeln är öppen baserat på schema eller manuell styrning
                                const isScheduled = comp.schedule_type === "scheduled";
                                const now = new Date();
                                const isWithinDates = isScheduled && 
                                    new Date(comp.start_date) <= now && 
                                    new Date(comp.end_date) >= now;

                                const isCurrentlyOpen = isScheduled ? isWithinDates : Boolean(comp.is_open);

                                return (
                                    <div key={comp.id} className="border p-4 rounded-lg shadow-sm bg-white space-y-3">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <h3 className="font-semibold text-lg">{comp.title}</h3>
                                                {!comp.is_visible && (
                                                    <span className="shrink-0 rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                                                        Dold
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded font-medium ${
                                                isCurrentlyOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}>
                                                {isCurrentlyOpen ? "Handel Öppen" : "Handel Stängd"}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600">{comp.description}</p>
                                        
                                        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded">
                                            <div>Startkapital: <strong>{Number(comp.starting_budget).toLocaleString("sv-SE")} kr</strong></div>
                                            <div>Max per aktie: <strong>{comp.max_stock_weight * 100}%</strong></div>
                                            <div>Kräv motivering: <strong>{comp.require_reasoning ? "Ja" : "Nej"}</strong></div>
                                            <div>Styrning: <strong>{isScheduled ? "Schemalagd" : "Manuell"}</strong></div>
                                        </div>

                                        <div className="flex gap-2 pt-2 flex-wrap">
                                            <Button
                                                size="sm"
                                                onClick={() => openTab({
                                                    id: `competition-${comp.id}`,
                                                    title: comp.title,
                                                    type: "competition",
                                                    competitionId: comp.id
                                                })}
                                            >
                                                Öppna tävling
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant={comp.is_visible ? "outline" : "secondary"}
                                                onClick={() => toggleCompetitionVisibility(comp.id, Boolean(comp.is_visible))}
                                                title={comp.is_visible ? "Dölj tävlingen för gruppen" : "Visa tävlingen för gruppen"}
                                            >
                                                {comp.is_visible ? (
                                                    <><EyeOff className="h-4 w-4 mr-1" /> Dölj för gruppen</>
                                                ) : (
                                                    <><Eye className="h-4 w-4 mr-1" /> Visa för gruppen</>
                                                )}
                                            </Button>

                                            {/* Visas bara om tävlingen har manuell styrning */}
                                            {!isScheduled && (
                                                <Button
                                                    size="sm"
                                                    variant={comp.is_open ? "destructive" : "outline"}
                                                    onClick={() => toggleMarketOpen(comp.id, comp.is_open)}
                                                >
                                                    {comp.is_open ? "Stäng handeln" : "Öppna handeln"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </BaseTabLayout>

            <CreateCompetitionDialog
                open={createCompetitionOpen}
                onOpenChange={setCreateCompetitionOpen}
                groupId={groupId}
                onCreated={loadCompetitions}
            />
        </>
    );
}