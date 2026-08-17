import { useRef } from "react";
import Draggable from "react-draggable";

export default function Seat({
    seat,
    onMove
}) {

    const nodeRef = useRef(null);

    return (

        <Draggable
            nodeRef={nodeRef}
            defaultPosition={{
                x: Number(seat.x_position),
                y: Number(seat.y_position)
            }}
            onStop={(e, data) => {

                onMove?.(
                    seat.id,
                    data.x,
                    data.y
                );

            }}
        >

            <div
                ref={nodeRef}
                className="
                    absolute
                    w-20
                    h-16
                    border
                    rounded
                    bg-white
                    shadow-sm
                    flex
                    items-center
                    justify-center
                    cursor-move
                "
            >
                {seat.seat_label}
            </div>

        </Draggable>

    );

}