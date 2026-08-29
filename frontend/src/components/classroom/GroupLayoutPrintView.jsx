export default function GroupLayoutPrintView({
    groupName,
    classroomName,
    layoutName,
    seats,
    students,
    assignments
}) {


    if (!seats?.length) {
        return null;
    }

    const minX = Math.min(
        ...seats.map(
            seat => Number(seat.x_position)
        )
    );

    const maxX = Math.max(
        ...seats.map(
            seat => Number(seat.x_position)
        )
    );

    const minY = Math.min(
        ...seats.map(
            seat => Number(seat.y_position)
        )
    );

    const maxY = Math.max(
        ...seats.map(
            seat => Number(seat.y_position)
        )
    );

    const printableWidth = 1000;
    const printableHeight = 550;

    const baseSeatWidth = 120;
    const baseSeatHeight = 60;

    const layoutWidth =
        maxX -
        minX +
        baseSeatWidth;

    const layoutHeight =
        maxY -
        minY +
        baseSeatHeight;

    const scale =
        Math.min(
            printableWidth /
                layoutWidth,
            printableHeight /
                layoutHeight
        ) * 0.9;

    const seatWidth =
        baseSeatWidth * scale;

    const seatHeight =
        baseSeatHeight * scale;

    const scaledWidth =
        layoutWidth * scale;

    const scaledHeight =
        layoutHeight * scale;

    const offsetX =
        (
            printableWidth -
            scaledWidth
        ) / 2;

    const offsetY =
        (
            printableHeight -
            scaledHeight
        ) / 2;

    return (

        <div
            style={{
                width: "100%",
                minHeight: "760px",
                background: "white",
                padding: "0px",
                fontFamily:
                    "Arial, sans-serif"
            }}
        >

            <div
                style={{
                    marginBottom: "20px"
                }}
            >

                <h1
                    style={{
                        margin: 0
                    }}
                >
                    {groupName}
                </h1>

                {classroomName && (
                    <div>
                        Klassrum:
                        {" "}
                        {classroomName}
                    </div>
                )}

                {layoutName && (
                    <div>
                        Möblering:
                        {" "}
                        {layoutName}
                    </div>
                )}

            </div>

            <div
                style={{
                    position: "relative",
                    width:
                        printableWidth,
                    height:
                        printableHeight,
                    margin: "0 auto",
                    border:
                        "2px solid #e5e7eb",
                    background:
                        "#ffffff"
                }}
            >

                {seats.map(
                    seat => {

                        const assignment =
                            assignments.find(
                                assignment =>
                                    assignment.classroom_seat_id ===
                                    seat.id
                            );

                        const student =
                            students.find(
                                student =>
                                    student.id ===
                                    assignment?.student_id
                            );

                        const left =
                            (
                                Number(
                                    seat.x_position
                                ) - minX
                            ) *
                            scale +
                            offsetX;

                        const top =
                            (
                                Number(
                                    seat.y_position
                                ) - minY
                            ) *
                            scale +
                            offsetY;

                        return (

                            <div
                                key={seat.id}
                                style={{
                                    position:
                                        "absolute",

                                    left,

                                    top,

                                    width: seatWidth,

                                    height: seatHeight,

                                    border:
                                        "1px solid black",

                                    borderRadius:
                                        "6px",

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center",

                                    textAlign:
                                        "center",

                                    padding:
                                        "4px",

                                    overflow:
                                        "hidden",

                                    background:
                                        "white",

                                    fontSize:
                                        Math.max(
                                            8,
                                            12 * scale
                                        ),

                                    fontWeight:
                                        600
                                }}
                            >

                                {student && (
                                    <div
                                        style={{
                                            whiteSpace:
                                                "normal",

                                            wordBreak:
                                                "break-word",

                                            lineHeight:
                                                1.2
                                        }}
                                    >

                                        {student.display_name || student.first_name}
                                        
                                    </div>
                                )}

                            </div>

                        );

                    }
                )}

            </div>

        </div>

    );

}