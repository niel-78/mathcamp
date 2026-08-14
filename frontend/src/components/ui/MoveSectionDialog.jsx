import { useState, useEffect } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";

export default function MoveSectionDialog({
    move,
    open,
    onOpenChange,
    onSubmit
}) {

    const [shiftForward,
        setShiftForward] =
        useState(false);

    useEffect(() => {

        if (open) {
            setShiftForward(false);
        }

    }, [open]);

    if (!move) {
        return null;
    }

    return (

        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >

            <DialogContent>

                <DialogHeader>

                    <DialogTitle>
                        Flytta sektion
                    </DialogTitle>

                </DialogHeader>

                <div className="space-y-4">

                    <p>
                        Hur vill du hantera
                        planeringen?
                    </p>

                    <label
                        className="
                            flex
                            items-center
                            gap-2
                        "
                    >

                        <Checkbox
                            checked={shiftForward}
                            onCheckedChange={
                                setShiftForward
                            }
                        />

                        <span>
                            Skjut fram efterföljande
                            sektioner tills en tom
                            lektion hittas
                        </span>

                    </label>

                    <div
                        className="
                            flex
                            justify-end
                            gap-2
                        "
                    >

                        <Button
                            variant="outline"
                            onClick={() =>
                                onOpenChange(false)
                            }
                        >
                            Avbryt
                        </Button>

                        <Button
                            onClick={() =>
                                onSubmit(
                                    shiftForward
                                )
                            }
                        >
                            Flytta
                        </Button>

                    </div>

                </div>

            </DialogContent>

        </Dialog>

    );

}