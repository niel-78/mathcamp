export default function BlockPoints({
    points,
    canEdit,
    onEditPoint
}) {

    return (

        <div className="mt-2 space-y-2">

            {points.map(point => (

                <div
                    key={point.id}
                    className={`
                        rounded
                        border
                        p-2

                        ${
                            canEdit
                                ? "cursor-pointer hover:bg-accent"
                                : ""
                        }
                    `}
                    onClick={() => {

                        if (!canEdit) {
                            return;
                        }

                        onEditPoint?.(point);

                    }}
                >

                    <div className="font-medium">
                        {point.points} p
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {point.competency_name}
                        {" "}
                        ({point.grade})
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {point.central_content}
                    </div>

                </div>

            ))}

        </div>

    );

}
