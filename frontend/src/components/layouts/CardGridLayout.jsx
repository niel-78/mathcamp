import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export default function CardGridLayout({
    children,
    pageSize = 12,
    minCardWidth = 500
}) {

    const items =
        useMemo(
            () =>
                Array.isArray(children)
                    ? children
                    : [children],
            [children]
        );

    const [page, setPage] =
        useState(1);

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                items.length /
                pageSize
            )
        );

    const visibleItems =
        items.slice(
            (page - 1) * pageSize,
            page * pageSize
        );

    return (

        <div
            className="
                w-full
                flex
                flex-col
                gap-4
            "
        >

            <div
                className="
                    w-full
                    grid
                    gap-4
                "
                style={{
                    gridTemplateColumns:
                        `repeat(
                            auto-fit,
                            minmax(
                                min(
                                    100%,
                                    ${minCardWidth}px
                                ),
                                1fr
                            )
                        )`
                }}
            >

                {visibleItems}

            </div>

            {
                totalPages > 1 && (

                    <div
                        className="
                            flex
                            items-center
                            justify-center
                            gap-2
                        "
                    >

                        <Button
                            variant="outline"
                            disabled={
                                page === 1
                            }
                            onClick={() =>
                                setPage(
                                    page - 1
                                )
                            }
                        >
                            Föregående
                        </Button>

                        <span
                            className="
                                text-sm
                                text-muted-foreground
                            "
                        >
                            Sida {page} av {totalPages}
                        </span>

                        <Button
                            variant="outline"
                            disabled={
                                page === totalPages
                            }
                            onClick={() =>
                                setPage(
                                    page + 1
                                )
                            }
                        >
                            Nästa
                        </Button>

                    </div>

                )
            }

        </div>

    );

}