import { useEffect, useState } from "react";

import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";

import BaseTabLayout
    from "@/components/layouts/BaseTabLayout";
import { Button } from "@/components/ui/button";
import Seat from "@/components/classroom/Seat";


export default function ClassroomLayoutTab({
    layoutId
}) {

    const [layout, setLayout] =
        useState(null);

    const [seats, setSeats] =
        useState([]);

    useEffect(() => {

        load();

    }, [layoutId]);

    const load = async () => {

        const layoutResponse =
            await fetch(
                `${API_URL}/api/classroom-layouts/${layoutId}`,
                {
                    headers: authHeaders()
                }
            );

        if (layoutResponse.ok) {

            setLayout(
                await layoutResponse.json()
            );

        }

        const seatsResponse =
            await fetch(
                `${API_URL}/api/classroom-layouts/${layoutId}/seats`,
                {
                    headers: authHeaders()
                }
            );

        if (seatsResponse.ok) {

            setSeats(
                await seatsResponse.json()
            );

        }

    };

    const createSeat = async () => {

        const label = prompt(
            "Platsbeteckning"
        );

        if (!label) {
            return;
        }

        const response =
            await fetch(
                `${API_URL}/api/classroom-layouts/${layoutId}/seats`,
                {
                    method: "POST",

                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        seat_label: label,
                        x_position: 100,
                        y_position: 100
                    })
                }
            );

        if (response.ok) {

            await load();

        }

    };

    const saveSeatPosition =
        async (
            seatId,
            x,
            y
        ) => {

            await fetch(
                `${API_URL}/api/classroom-seats/${seatId}`,
                {
                    method: "PUT",
                    headers: {
                        ...authHeaders(),
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        x_position: x,
                        y_position: y
                    })
                }
            );

            setSeats(prev =>
                prev.map(seat =>
                    seat.id === seatId
                        ? {
                            ...seat,
                            x_position: x,
                            y_position: y
                        }
                        : seat
                )
            );

        };

    return (

        <BaseTabLayout
            title={
                layout?.name ??
                "Möblering"
            }
            actions={
                <Button
                    onClick={createSeat}
                >
                    Lägg till plats
                </Button>
            }
        >

                

            <div
                className="
                    relative
                    bg-slate-50
                    border
                    rounded-lg
                    w-full
                    h-[700px]
                "
            >
                {seats.length === 0 && (

                    <div
                        className="
                            text-muted-foreground
                            p-4
                        "
                    >
                        Inga platser skapade ännu.
                    </div>

                )}
                {seats.map(seat => (

                    <Seat
                        key={seat.id}
                        seat={seat}
                        onMove={
                            saveSeatPosition
                        }
                    />

                ))}

            </div>

        </BaseTabLayout>

    );

}