import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function GroupAbilitySeriesDialog({
    group,
    open,
    onOpenChange,
    onSaved
}) {

    const [series, setSeries] = useState([]);
    const [seriesId, setSeriesId] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {

        if (!open) {
            return;
        }

        setSeriesId(
            group?.abilitySeriesId
                ? String(group.abilitySeriesId)
                : ""
        );

        const loadSeries = async () => {

            const response = await fetch(
                `${API_URL}/api/ability-series`,
                {
                    headers: authHeaders()
                }
            );

            const data = await response.json();

            setSeries(Array.isArray(data) ? data : []);

        };

        loadSeries();

    }, [open, group]);

    const save = async () => {

        try {

            setSaving(true);

            const response = await fetch(
                `${API_URL}/api/groups/${group.id}/ability-series`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({
                        ability_series_id:
                            seriesId ? Number(seriesId) : null
                    })
                }
            );

            if (response.ok) {

                onOpenChange(false);

                onSaved?.();

            }

        } finally {

            setSaving(false);

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
                        Ändra förmågaserie
                    </DialogTitle>

                </DialogHeader>

                <select
                    className="input-standard"
                    value={seriesId}
                    onChange={(e) =>
                        setSeriesId(e.target.value)
                    }
                >

                    <option value="">
                        Ingen förmågaserie
                    </option>

                    {series.map(item => (

                        <option
                            key={item.id}
                            value={item.id}
                        >
                            {item.name}
                        </option>

                    ))}

                </select>

                <Button
                    disabled={saving}
                    onClick={save}
                    className="
                        bg-blue-600
                        text-white
                        rounded
                        px-4
                        py-2
                    "
                >
                    Spara
                </Button>

            </DialogContent>

        </Dialog>

    );

}
