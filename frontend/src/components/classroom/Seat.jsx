import { useDraggable } from "@dnd-kit/core";

export default function Seat({ seat }) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform
    } = useDraggable({
        id: `seat-${seat.id}`,
        data: {
            type: "seat",
            seatId: seat.id,
            x: Number(seat.x_position),
            y: Number(seat.y_position)
        }
    });

    const currentX =
        Number(seat.x_position) +
        (transform?.x || 0);

    const currentY =
        Number(seat.y_position) +
        (transform?.y || 0);

    console.log(
        seat.id,
        currentX,
        currentY
    );

    if (transform) {

        console.log(
            seat.id,
            transform.x,
            transform.y
        );

    }


    const style = {
        left: Number(seat.x_position),
        top: Number(seat.y_position),
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined
    };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
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
            style={style}
        >
            {seat.seat_label}
        </div>
    );

}