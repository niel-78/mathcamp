import { useRef } from "react";
import Draggable from "react-draggable";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";

import { MoreVertical } from "lucide-react";

const SEAT_WIDTH = 120;
const SEAT_HEIGHT = 64;

const GRID_X = SEAT_WIDTH / 3;
const GRID_Y = SEAT_HEIGHT / 3;

export default function Seat({
    seat,
    onMove,
    onDelete
}) {

    const nodeRef = useRef(null);

    const snap = (value, gridSize) =>
        Math.round(value / gridSize) *
        gridSize;

    return (

        <Draggable
            nodeRef={nodeRef}
            position={{
                x: Number(seat.x_position),
                y: Number(seat.y_position)
            }}
            onStop={(e, data) => {

                const snappedX =
                    snap(data.x, GRID_X);

                const snappedY =
                    snap(data.y, GRID_Y);

                onMove?.(
                    seat.id,
                    snappedX,
                    snappedY
                );

            }}
        >

            <div
                ref={nodeRef}
                className="
                    absolute
                    border
                    rounded
                    bg-white
                    shadow-sm
                    flex
                    items-center
                    justify-center
                    cursor-move
                    select-none
                "
                style={{
                    width: `${SEAT_WIDTH}px`,
                    height: `${SEAT_HEIGHT}px`
                }}
            >
                <div
                    className="
                        absolute
                        top-1
                        right-1
                    "
                >

                    <DropdownMenu>

                        <DropdownMenuTrigger
                            className="
                                inline-flex
                                h-5
                                w-5
                                items-center
                                justify-center
                                rounded
                                hover:bg-accent
                            "
                        >

                            <MoreVertical size={12} />

                        </DropdownMenuTrigger>

                        <DropdownMenuContent>

                            <DropdownMenuItem
                                className="
                                    text-destructive
                                "
                                onClick={() =>
                                    onDelete?.(seat)
                                }
                            >
                                Radera
                            </DropdownMenuItem>

                        </DropdownMenuContent>

                    </DropdownMenu>

                </div>

            </div>

        </Draggable>

    );

}