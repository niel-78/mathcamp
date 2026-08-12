import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

export default function PointDialog({
    open,
    onOpenChange,
    blockId,
    point,
    onSaved
}) {

    const [centralContent, setCentralContent] = useState([]);
    const [gradingAbilityLevels, setGradingAbilityLevels] = useState([]);
    const [centralContentId, setCentralContentId] = useState("");
    const [gradingAbilityLevelId, setGradingAbilityLevelId] = useState("");
    const [points, setPoints] = useState(1);
    const [comment, setComment] = useState("");

    useEffect(() => {

        if (!open) {
            return;
        }

        loadData();

    }, [open]);

    useEffect(() => {

        if (!point) {

            setCentralContentId("");
            setGradingAbilityLevelId("");
            setPoints(1);
            setComment("");

            return;

        }

        setCentralContentId(
            String(point.central_content_id)
        );

        setGradingAbilityLevelId(
            String(point.grading_ability_level_id)
        );

        setPoints(
            point.points ?? "1"
        );

        setComment(
            point.comment ?? ""
        );

    }, [point]);

    useEffect(() => {

        if (!point) {
            return;
        }

        console.log("EDIT POINT", point);

    }, [point]);

    const loadData = async () => {

        const response =
            await fetch(
                `${API_URL}/api/blocks/${blockId}/point-metadata`,
                {
                    headers: authHeaders()
                }
            );

        const data =
            await response.json();

        setCentralContent(
            data.centralContent
        );

        setGradingAbilityLevels(
            data.gradingAbilityLevels
        );

    };

    const save = async () => {

        const method =
            point?.id
                ? "PUT"
                : "POST";

        const url =
            point?.id
                ? `${API_URL}/api/block-points/${point.id}`
                : `${API_URL}/api/blocks/${blockId}/points`;

        const response =
            await fetch(
                url,
                {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json",
                        ...authHeaders()
                    },
                    body: JSON.stringify({
                        central_content_id:
                            centralContentId,
                        grading_ability_level_id:
                            gradingAbilityLevelId,
                        points,
                        comment
                    })
                }
            );

        if (!response.ok) {
            return;
        }

        onSaved?.();

        onOpenChange(false);

    };

    const remove = async () => {

        if (!point?.id) {
            return;
        }

        const response =
            await fetch(
                `${API_URL}/api/block-points/${point.id}`,
                {
                    method: "DELETE",
                    headers:
                        authHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        onSaved?.();

        onOpenChange(false);

    };

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>

                        {
                            point
                                ? "Redigera poäng"
                                : "Ny poäng"
                        }

                    </DialogTitle>

                </DialogHeader>

                <label>
                    Centralt innehåll
                </label>

                <select
                    value={centralContentId}
                    onChange={e =>
                        setCentralContentId(
                            e.target.value
                        )
                    }
                    className="
                        border
                        rounded
                        p-2
                        w-full
                    "
                >

                    <option value="">
                        Välj
                    </option>

                    {centralContent.map(
                        item => (

                            <option
                                key={item.id}
                                value={String(item.id)}
                            >
                                {item.content}
                            </option>

                        )
                    )}

                </select>

                <label>
                    Kunskapskrav
                </label>

                <select
                    value={
                        gradingAbilityLevelId
                    }
                    onChange={e =>
                        setGradingAbilityLevelId(
                            e.target.value
                        )
                    }
                    className="
                        border
                        rounded
                        p-2
                        w-full
                    "
                >

                    <option value="">
                        Välj
                    </option>

                    {gradingAbilityLevels.map(
                        item => (

                            <option
                                key={item.id}
                                value={String(item.id)}
                            >
                                {item.name}
                                {" "}
                                ({item.level})
                            </option>

                        )
                    )}

                </select>

                <label>
                    Poäng
                </label>

                <input
                    type="number"
                    min="2"
                    step="1"
                    value={points ?? ""}
                    onChange={e =>
                        setPoints(
                            e.target.value
                        )
                    }
                    className="
                        border
                        rounded
                        p-2
                        w-full
                    "
                />

                <label>
                    Kommentar
                </label>

                <textarea
                    value={comment}
                    onChange={e =>
                        setComment(
                            e.target.value
                        )
                    }
                    className="
                        border
                        rounded
                        p-2
                        w-full
                    "
                    rows={4}
                />

                <div className="flex gap-2">

                    <Button
                        onClick={save}
                    >
                        Spara
                    </Button>

                    {point?.id && (

                        <Button
                            variant="destructive"
                            onClick={remove}
                        >
                            Radera
                        </Button>

                    )}

                </div>

            </DialogContent>

        </Dialog>

    );

}